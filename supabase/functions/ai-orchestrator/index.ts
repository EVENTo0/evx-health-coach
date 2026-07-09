// ================================================================
// EVX AI Orchestrator — Supabase Edge Function
// Runs server-side. OpenAI key never exposed to client.
// ================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const openAIKey = Deno.env.get('OPENAI_API_KEY') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ----------------------------------------------------------------
// OpenAI call helper
// ----------------------------------------------------------------
async function callOpenAI(systemPrompt: string, userPrompt: string, maxTokens = 2000): Promise<unknown> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAIKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? `OpenAI error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

// ----------------------------------------------------------------
// Build user context string from health profile
// ----------------------------------------------------------------
function buildContext(p: Record<string, unknown>): string {
  return `
User Profile:
- Age: ${p.age} | Gender: ${p.gender}
- Height: ${p.height_cm}cm | Weight: ${p.weight_kg}kg
- BMI: ${(Number(p.weight_kg) / Math.pow(Number(p.height_cm) / 100, 2)).toFixed(1)}
- Primary Goal: ${String(p.primary_goal).replace('_', ' ')}
- Activity Level: ${String(p.activity_level).replace('_', ' ')}
- Fitness Level: ${p.fitness_level}
- Equipment: ${p.equipment}
- Health Conditions: ${(p.health_conditions as string[]).join(', ') || 'None'}
- Food Preferences: ${(p.food_preferences as string[]).join(', ') || 'No preferences'}
- Food Restrictions: ${(p.food_restrictions as string[]).join(', ') || 'None'}
- Work Hours: ${p.work_start_time} – ${p.work_end_time}
- Training Hours: ${p.training_start_time} – ${p.training_end_time}
- Sleep Target: ${p.sleep_hours_target} hours
- Recent Symptoms (last 3 days): ${p.recent_symptoms ?? 'No symptoms reported recently.'}
`.trim();
}

// ----------------------------------------------------------------
// TDEE calculator
// ----------------------------------------------------------------
function calcTDEE(p: Record<string, unknown>): number {
  const wt = Number(p.weight_kg);
  const ht = Number(p.height_cm);
  const age = Number(p.age);
  const bmr = p.gender === 'male'
    ? 10 * wt + 6.25 * ht - 5 * age + 5
    : 10 * wt + 6.25 * ht - 5 * age - 161;
  const mult: Record<string, number> = {
    sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55,
    very_active: 1.725, extremely_active: 1.9,
  };
  return Math.round(bmr * (mult[String(p.activity_level)] ?? 1.55));
}

// ----------------------------------------------------------------
// Workflow handlers
// ----------------------------------------------------------------
async function workoutWorkflow(profile: Record<string, unknown>): Promise<unknown> {
  return callOpenAI(
    `You are EVX Fit — an expert personal trainer and sports scientist.
Generate safe, progressive, evidence-based workout plans.
Always account for health conditions AND recent reported symptoms — e.g. reduce
intensity/volume or swap to recovery/mobility work on days with fatigue, poor
sleep, soreness, or illness-type symptoms. Explicitly note any adjustment made
because of symptoms in the "notes" field. Return ONLY valid JSON.`,
    `${buildContext(profile)}

Generate a complete workout plan for today. Return JSON:
{
  "title": "string",
  "type": "strength|cardio|hiit|flexibility|recovery",
  "duration_minutes": number,
  "difficulty": "beginner|intermediate|advanced",
  "warm_up": [{"name":"","sets":0,"reps":"","rest_seconds":0,"instructions":"","modifications":""}],
  "main_exercises": [{"name":"","sets":0,"reps":"","rest_seconds":0,"instructions":"","modifications":""}],
  "cool_down": [{"name":"","sets":0,"reps":"","rest_seconds":0,"instructions":"","modifications":""}],
  "notes": "string"
}
Include 5–8 main exercises.`,
    2000
  );
}

async function nutritionWorkflow(profile: Record<string, unknown>): Promise<unknown> {
  const tdee = calcTDEE(profile);
  const goal = String(profile.primary_goal);
  const target = goal === 'fat_loss' ? tdee - 500 : goal === 'muscle_gain' ? tdee + 300 : tdee;

  return callOpenAI(
    `You are EVX Nutrition — an expert registered dietitian and sports nutritionist.
Generate practical, balanced, culturally-aware meal plans.
Use real, accessible foods with specific portions. Adjust for recent reported
symptoms — e.g. more hydration/electrolytes and easily-digestible foods for
nausea/bloating, extra iron/protein-rich foods for fatigue. Mention any
symptom-driven adjustment in the "notes" field. Return ONLY valid JSON.`,
    `${buildContext(profile)}

TDEE: ~${tdee} kcal | Target: ~${target} kcal

Return JSON:
{
  "total_calories": number,
  "total_protein_g": number,
  "total_carbs_g": number,
  "total_fat_g": number,
  "water_goal_liters": number,
  "breakfast": {"name":"","time":"","foods":[""],"calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"notes":""},
  "lunch": {"name":"","time":"","foods":[""],"calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"notes":""},
  "dinner": {"name":"","time":"","foods":[""],"calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"notes":""},
  "snacks": [{"name":"","time":"","foods":[""],"calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"notes":""}],
  "protein_guidance": "string",
  "hydration_guidance": "string",
  "notes": "string"
}`,
    2500
  );
}

async function labWorkflow(profile: Record<string, unknown>, labText: string): Promise<unknown> {
  return callOpenAI(
    `You are EVX Lab — a health educator explaining lab results in simple, empowering language.
You are NOT a doctor. Provide educational information only. Never diagnose or prescribe.
Return ONLY valid JSON.`,
    `${buildContext(profile)}

Lab Report:
${labText}

Return JSON:
{
  "summary": "2-3 sentence plain-language overview",
  "educational_explanations": [{"name":"","value":"","normal_range":"","explanation":"","lifestyle_tip":""}],
  "lifestyle_recommendations": ["recommendation"],
  "risk_awareness_notes": ["note for doctor discussion"],
  "disclaimer": "This information is educational and not medical advice. Always consult your healthcare provider."
}`,
    2500
  );
}

async function dailyPlanWorkflow(profile: Record<string, unknown>, date: string): Promise<unknown> {
  return callOpenAI(
    `You are EVX Coach — a holistic wellness coach creating optimized daily schedules.
Balance work, training, nutrition, recovery, and sleep. Be specific with times.
Return ONLY valid JSON.`,
    `${buildContext(profile)}

Date: ${date}

Return JSON:
{
  "timeline": [{"time":"HH:MM","activity":"description","type":"sleep|meal|workout|work|recovery|hydration|supplement|other","duration_minutes":0,"notes":""}],
  "priorities": ["priority 1", "priority 2", "priority 3"],
  "recovery_reminders": ["reminder"],
  "motivational_note": "one inspiring personalized sentence"
}
Create 10-15 timeline items. Respect work ${profile.work_start_time}–${profile.work_end_time} and training ${profile.training_start_time}–${profile.training_end_time}.`,
    2000
  );
}


async function progressInsightsWorkflow(profile: Record<string, unknown>, logs: Record<string, unknown>[]): Promise<unknown> {
  if (!logs.length) {
    return {
      headline: "Start logging to unlock insights",
      summary: "Log your first progress entry to get personalised coaching feedback.",
      trends: [],
      recommendations: [],
      motivation: "Every expert was once a beginner. Log today — your data starts working for you immediately."
    };
  }

  const logSummary = logs.slice(0, 14).map(l =>
    `${l.date}: weight=${l.weight_kg ?? 'N/A'}kg, energy=${l.energy_level ?? 'N/A'}/10, mood=${l.mood ?? 'N/A'}/10, sleep=${l.sleep_hours ?? 'N/A'}h, water=${l.water_intake_liters ?? 'N/A'}L, workout=${l.workout_completed ? 'yes' : 'no'}`
  ).join('\n');

  return callOpenAI(
    `You are EVX Coach — a warm, expert wellness coach who turns raw health data into clear, actionable insights.
Be concise, positive, and specific. Never be generic. Always reference actual numbers from the data.
Return ONLY valid JSON.`,
    `${buildContext(profile)}

Recent Progress Logs (newest first):
${logSummary}

Analyse trends and return JSON:
{
  "headline": "2-5 word punchy coaching headline e.g. 'Strong week — push harder'",
  "summary": "2-3 sentence personalised analysis referencing real numbers from the data",
  "trends": [
    {"metric": "weight|energy|mood|sleep|workout_rate", "direction": "up|down|stable", "observation": "specific one-line finding"}
  ],
  "recommendations": ["3 specific, actionable recommendations based on the actual data"],
  "motivation": "One personalized, energising sentence referencing their specific situation"
}`,
    1000
  );
}

// ----------------------------------------------------------------
// Main handler
// ----------------------------------------------------------------
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // Authenticate user via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: CORS });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });
    }

    const body = await req.json();
    const { workflow } = body;
    // Accept both old shape {profile} and client shape {userContext, input}
    const profile: Record<string, unknown> = body.profile ?? body.userContext ?? {};
    const input: Record<string, unknown> = body.input ?? {};
    const lab_text: string = body.lab_text ?? input.lab_text ?? '';
    const date: string = body.date ?? input.date ?? new Date().toISOString().split('T')[0];
    const logs: Record<string, unknown>[] = body.logs ?? input.logs ?? [];

    let result: unknown;

    switch (workflow) {
      case 'workout':
        result = await workoutWorkflow(profile);
        break;
      case 'nutrition':
        result = await nutritionWorkflow(profile);
        break;
      case 'lab':
        result = await labWorkflow(profile, lab_text);
        break;
      case 'daily_plan':
        result = await dailyPlanWorkflow(profile, date);
        break;
      case 'progress_insights':
        result = await progressInsightsWorkflow(profile, logs);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown workflow: ${workflow}` }),
          { status: 400, headers: CORS }
        );
    }

    return new Response(JSON.stringify(result), { headers: CORS });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[EVX AI Orchestrator]', message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: CORS });
  }
});
