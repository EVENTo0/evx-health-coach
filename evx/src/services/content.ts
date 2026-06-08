/**
 * EVX Content Service — Phase 3 Education Platform
 * Fetches articles, videos, and tips from Supabase.
 * Falls back to curated static content if DB is empty.
 */

import { supabase } from './supabase';

export interface Article {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: 'nutrition' | 'training' | 'recovery' | 'mindset' | 'labs';
  emoji: string;
  read_time_minutes: number;
  published_at: string;
  tags: string[];
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  category: string;
  duration_seconds: number;
  published_at: string;
}

export interface DailyTip {
  id: string;
  text: string;
  category: string;
  emoji: string;
}

// ----------------------------------------------------------------
// Curated fallback content (shown until DB is populated)
// ----------------------------------------------------------------
const FALLBACK_ARTICLES: Article[] = [
  {
    id: 'f1', title: 'Why Protein Timing Matters', summary: 'The science of when to eat protein for maximum muscle retention and fat loss.',
    body: 'Research consistently shows that distributing protein intake across 3–5 meals maximises muscle protein synthesis. Aim for 0.4g/kg per meal, prioritising a meal within 2 hours post-workout...',
    category: 'nutrition', emoji: '🥩', read_time_minutes: 4, published_at: new Date().toISOString(), tags: ['protein', 'muscle', 'fat loss'],
  },
  {
    id: 'f2', title: 'Sleep: The Overlooked Performance Tool', summary: 'How 7–9 hours of quality sleep transforms your results more than any supplement.',
    body: 'During deep sleep, your body releases 70% of its daily growth hormone. Sleep deprivation increases cortisol by up to 37%, directly causing fat storage and muscle breakdown...',
    category: 'recovery', emoji: '😴', read_time_minutes: 5, published_at: new Date().toISOString(), tags: ['sleep', 'recovery', 'hormones'],
  },
  {
    id: 'f3', title: 'Understanding Your Lab Results', summary: 'A plain-English guide to the 10 most important biomarkers for health and performance.',
    body: 'Your blood panel tells a story. Key markers: HbA1c (blood sugar control), hsCRP (inflammation), Vitamin D (immune + mood), Testosterone (muscle + drive), Ferritin (iron stores)...',
    category: 'labs', emoji: '🧬', read_time_minutes: 7, published_at: new Date().toISOString(), tags: ['labs', 'biomarkers', 'health'],
  },
  {
    id: 'f4', title: 'The Science of Progressive Overload', summary: 'Why adding just 2.5kg per week compounds into extraordinary strength gains.',
    body: 'Progressive overload is the single most important training principle. Your muscles adapt to stress — to keep growing, the stimulus must keep increasing. Options: more weight, more reps, less rest, more volume...',
    category: 'training', emoji: '📈', read_time_minutes: 4, published_at: new Date().toISOString(), tags: ['strength', 'training', 'muscle'],
  },
  {
    id: 'f5', title: 'Cold Exposure & Recovery', summary: 'Ice baths, cold showers, and the evidence for faster muscle recovery.',
    body: 'Cold water immersion (10–15°C for 10–15 min) reduces DOMS by up to 30%. However, timing matters — avoid cold immediately post-strength training as it may blunt hypertrophy signalling...',
    category: 'recovery', emoji: '🧊', read_time_minutes: 3, published_at: new Date().toISOString(), tags: ['recovery', 'cold', 'performance'],
  },
  {
    id: 'f6', title: 'Mindset: Identity-Based Habit Formation', summary: 'Why "I am an athlete" works better than "I want to lose weight."',
    body: 'James Clear\'s research shows identity-based habits outperform goal-based habits 3:1 for long-term adherence. Instead of "I want to run a marathon", adopt "I am a runner". Every action reinforces identity...',
    category: 'mindset', emoji: '🧠', read_time_minutes: 5, published_at: new Date().toISOString(), tags: ['mindset', 'habits', 'psychology'],
  },
];

const DAILY_TIPS: DailyTip[] = [
  { id: 't1', text: 'Drink 500ml of water within 10 minutes of waking up. It kickstarts metabolism by up to 30% for the next hour.', category: 'nutrition', emoji: '💧' },
  { id: 't2', text: 'A 10-minute walk after meals reduces blood sugar spikes by up to 22%. No gym required.', category: 'training', emoji: '🚶' },
  { id: 't3', text: 'Keeping your room at 18–19°C improves deep sleep quality significantly. Cold room = better recovery.', category: 'recovery', emoji: '🌡️' },
  { id: 't4', text: 'Protein at breakfast reduces overall daily calorie intake by ~400 kcal on average due to satiety hormones.', category: 'nutrition', emoji: '🍳' },
  { id: 't5', text: 'Two minutes of deep breathing before bed activates the parasympathetic system and accelerates sleep onset.', category: 'mindset', emoji: '🧘' },
];

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------
export const getArticles = async (category?: string): Promise<Article[]> => {
  try {
    let query = supabase.from('articles').select('*').order('published_at', { ascending: false });
    if (category && category !== 'all') query = query.eq('category', category);
    const { data, error } = await query.limit(20);
    if (error || !data || data.length === 0) return FALLBACK_ARTICLES.filter(a => !category || category === 'all' || a.category === category);
    return data as Article[];
  } catch {
    return FALLBACK_ARTICLES;
  }
};

export const getArticleById = async (id: string): Promise<Article | null> => {
  const fallback = FALLBACK_ARTICLES.find(a => a.id === id);
  try {
    const { data } = await supabase.from('articles').select('*').eq('id', id).single();
    return (data as Article) ?? fallback ?? null;
  } catch {
    return fallback ?? null;
  }
};

export const getDailyTip = (): DailyTip => {
  const dayIndex = new Date().getDate() % DAILY_TIPS.length;
  return DAILY_TIPS[dayIndex];
};

export const ARTICLE_CATEGORIES = [
  { key: 'all', label: 'All', emoji: '✨' },
  { key: 'nutrition', label: 'Nutrition', emoji: '🥗' },
  { key: 'training', label: 'Training', emoji: '💪' },
  { key: 'recovery', label: 'Recovery', emoji: '😴' },
  { key: 'mindset', label: 'Mindset', emoji: '🧠' },
  { key: 'labs', label: 'Labs', emoji: '🧬' },
] as const;
