import { OPENAI_API_KEY, AI_CONFIG } from '../constants/config';
import type { HealthProfile, WorkoutPlan, NutritionPlan, LabAnalysis, DailyPlan } from '../types';

// ===== AI ORCHESTRATOR SERVICE =====
// Central AI service that loads user context, builds prompts, and returns structured data.

const callOpenAI = async (systemPrompt: string, userPrompt: string): Promise<string> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'AI request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// Build context string from health profile
const buildUserContext = (profile: HealthProfile): string => {
  return `
User Profile:
- Age: ${profile.age} | Gender: ${profile.gender}
- Height: ${profile.height_cm}cm | Weight: ${profile.weight_kg}kg
- BMI: ${(profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)}
- Primary Goal: ${profile.primary_goal.replace('_', ' ')}
- Secondary Goals: ${profile.secondary_goals.join(', ')}
- Activity Level: ${profile.activity_level.replace('_', ' ')}
- Fitness Level: ${profile.fitness_level}
- Equipment: ${profile.equipment}
- Health Conditions: ${profile.health_conditions.join(', ') || 'None'}
- Food Preferences: ${profile.food_preferences.join(', ') || 'No preferences'}
- Food Restrictions: ${profile.food_restrictions.join(', ') || 'None'}
- Work Hours: ${profile.work_start_time} – ${profile.work_end_time}
- Training Hours: ${profile.training_start_time} – ${profile.training_end_time}
- Sleep Target: ${profile.sleep_hours_target} hours
`.trim();
};

// ===== WORKOUT WORKFLOW =====
export const generateWorkout = async (profile: HealthProfile): Promise<Partial<WorkoutPlan>> => {
  const systemPrompt = `You are EVX Fit — an expert personal trainer and sports scientist.
Generate safe, progressive, evidence-based workout plans.
Always account for the user's health conditions and modify exercises accordingly.
Return ONLY valid JSON matching the exact structure requested.`;

  const userPrompt = `${buildUserContext(profile)}

Generate a complete workout plan for today. Return JSON with this exact structure:
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
Include 5–8 main exercises. Make it appropriate for ${profile.fitness_level} level.`;

  const raw = await callOpenAI(systemPrompt, userPrompt);
  return JSON.parse(raw);
};

// ===== NUTRITION WORKFLOW =====
export const generateMealPlan = async (profile: HealthProfile): Promise<Partial<NutritionPlan>> => {
  const tdee = calculateTDEE(profile);
  const targetCalories = profile.primary_goal === 'fat_loss'
    ? tdee - 500
    : profile.primary_goal === 'muscle_gain'
      ? tdee + 300
      : tdee;

  const systemPrompt = `You are EVX Nutrition — an expert registered dietitian and sports nutritionist.
Generate practical, balanced, culturally-aware meal plans.
Use real, accessible foods. Provide specific portions.
Return ONLY valid JSON matching the exact structure requested.`;

  const userPrompt = `${buildUserContext(profile)}

TDEE: ~${tdee} kcal | Target calories: ~${targetCalories} kcal

Generate a full-day meal plan. Return JSON with this exact structure:
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
}`;

  const raw = await callOpenAI(systemPrompt, userPrompt);
  return JSON.parse(raw);
};

// ===== LAB WORKFLOW =====
export const analyzeLabReport = async (
  profile: HealthProfile,
  labText: string
): Promise<Partial<LabAnalysis>> => {
  const systemPrompt = `You are EVX Lab — a health educator who explains lab results in simple, empowering language.
You are NOT a doctor. You provide educational information only.
Focus on lifestyle improvements. Never diagnose or prescribe.
Return ONLY valid JSON matching the exact structure requested.`;

  const userPrompt = `${buildUserContext(profile)}

Lab Report Content:
${labText}

Analyze these lab results educationally. Return JSON with this exact structure:
{
  "summary": "2-3 sentence plain-language overview",
  "educational_explanations": [
    {"name":"marker name","value":"result value","normal_range":"reference range","explanation":"simple explanation","lifestyle_tip":"actionable tip"}
  ],
  "lifestyle_recommendations": ["recommendation 1", "recommendation 2"],
  "risk_awareness_notes": ["note about what to discuss with doctor"],
  "disclaimer": "This information is educational and not medical advice. Always consult your healthcare provider for diagnosis, treatment, or medical decisions."
}`;

  const raw = await callOpenAI(systemPrompt, userPrompt);
  return JSON.parse(raw);
};

// ===== DAILY PLANNING WORKFLOW =====
export const generateDailyPlan = async (
  profile: HealthProfile,
  date: string
): Promise<Partial<DailyPlan>> => {
  const systemPrompt = `You are EVX Coach — a holistic wellness coach who creates optimized daily schedules.
Balance work, training, nutrition, recovery, and sleep for peak performance.
Be specific with times. Prioritize sustainable habits.
Return ONLY valid JSON matching the exact structure requested.`;

  const userPrompt = `${buildUserContext(profile)}

Date: ${date}

Generate a complete daily plan. Return JSON with this exact structure:
{
  "timeline": [
    {"time":"HH:MM","activity":"description","type":"sleep|meal|workout|work|recovery|hydration|supplement|other","duration_minutes":0,"notes":""}
  ],
  "priorities": ["top 3 focus items for the day"],
  "recovery_reminders": ["hydration reminder", "stretch reminder", "sleep hygiene tip"],
  "motivational_note": "one inspiring, personalized sentence"
}
Create 10-15 timeline items covering wake-up through sleep.
Respect work hours ${profile.work_start_time}–${profile.work_end_time} and training ${profile.training_start_time}–${profile.training_end_time}.`;

  const raw = await callOpenAI(systemPrompt, userPrompt);
  return JSON.parse(raw);
};

// ===== HELPERS =====
const calculateTDEE = (profile: HealthProfile): number => {
  // Mifflin-St Jeor BMR
  const bmr = profile.gender === 'male'
    ? 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5
    : 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161;

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };

  return Math.round(bmr * (activityMultipliers[profile.activity_level] || 1.55));
};
