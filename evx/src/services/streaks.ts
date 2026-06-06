/**
 * EVX Streak Engine
 * 
 * Tracks daily consistency across: workouts, meal logging, water, sleep, daily plan.
 * Awards XP and milestone badges.
 */

import { supabase } from './supabase';
import { scheduleStreakCelebration } from './notifications';

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  total_active_days: number;
  xp_total: number;
  level: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earned_at: string;
}

// XP per action
const XP_VALUES = {
  workout_completed: 50,
  meal_logged: 20,
  water_goal_hit: 15,
  sleep_goal_hit: 25,
  daily_plan_opened: 10,
  lab_uploaded: 30,
  progress_logged: 20,
  streak_day: 5,        // bonus per streak day
};

// Milestone badges
const BADGES: Array<{ id: string; name: string; description: string; emoji: string; trigger: (streak: number, xp: number) => boolean }> = [
  { id: 'first_day', name: 'Day One', description: 'Started your journey', emoji: '🌱', trigger: (s) => s >= 1 },
  { id: 'streak_3', name: 'Ignition', description: '3-day streak', emoji: '🔥', trigger: (s) => s >= 3 },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', emoji: '⚡', trigger: (s) => s >= 7 },
  { id: 'streak_14', name: 'Fortnight Fighter', description: '14-day streak', emoji: '🏆', trigger: (s) => s >= 14 },
  { id: 'streak_30', name: 'Iron Mind', description: '30-day streak', emoji: '💎', trigger: (s) => s >= 30 },
  { id: 'streak_90', name: 'Elite', description: '90-day streak', emoji: '🚀', trigger: (s) => s >= 90 },
  { id: 'xp_500', name: 'Committed', description: 'Earned 500 XP', emoji: '⭐', trigger: (_, xp) => xp >= 500 },
  { id: 'xp_2000', name: 'Dedicated', description: 'Earned 2000 XP', emoji: '🌟', trigger: (_, xp) => xp >= 2000 },
  { id: 'xp_5000', name: 'Champion', description: 'Earned 5000 XP', emoji: '👑', trigger: (_, xp) => xp >= 5000 },
];

const xpToLevel = (xp: number): number => Math.floor(Math.sqrt(xp / 100)) + 1;

// ----------------------------------------------------------------
// Update streak after a user action
// ----------------------------------------------------------------
export const recordActivity = async (
  userId: string,
  action: keyof typeof XP_VALUES
): Promise<StreakData> => {
  const today = new Date().toISOString().split('T')[0];
  const xpEarned = XP_VALUES[action];

  // Get current streak record
  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  let current_streak = existing?.current_streak ?? 0;
  let longest_streak = existing?.longest_streak ?? 0;
  let total_active_days = existing?.total_active_days ?? 0;
  let xp_total = (existing?.xp_total ?? 0) + xpEarned;
  const last_active_date = existing?.last_active_date ?? null;
  const earned_badges: Badge[] = existing?.badges ?? [];

  // Update streak logic
  if (last_active_date !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (last_active_date === yesterdayStr) {
      // Consecutive day — extend streak
      current_streak += 1;
      xp_total += XP_VALUES.streak_day * current_streak; // bonus scales with streak
    } else if (last_active_date !== today) {
      // Streak broken — reset
      current_streak = 1;
    }

    total_active_days += 1;
    longest_streak = Math.max(longest_streak, current_streak);

    // Check for new badges
    for (const badge of BADGES) {
      const alreadyEarned = earned_badges.some((b) => b.id === badge.id);
      if (!alreadyEarned && badge.trigger(current_streak, xp_total)) {
        earned_badges.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          emoji: badge.emoji,
          earned_at: new Date().toISOString(),
        });
      }
    }

    // Fire streak milestone notification
    const milestones = [3, 7, 14, 30, 90];
    if (milestones.includes(current_streak)) {
      await scheduleStreakCelebration(current_streak);
    }
  }

  const level = xpToLevel(xp_total);

  const streakData: StreakData = {
    current_streak,
    longest_streak,
    last_active_date: today,
    total_active_days,
    xp_total,
    level,
    badges: earned_badges,
  };

  // Upsert to DB
  await supabase
    .from('streaks')
    .upsert({ user_id: userId, ...streakData, updated_at: new Date().toISOString() });

  return streakData;
};

// ----------------------------------------------------------------
// Fetch current streak data
// ----------------------------------------------------------------
export const getStreakData = async (userId: string): Promise<StreakData | null> => {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    current_streak: data.current_streak,
    longest_streak: data.longest_streak,
    last_active_date: data.last_active_date,
    total_active_days: data.total_active_days,
    xp_total: data.xp_total,
    level: xpToLevel(data.xp_total),
    badges: data.badges ?? [],
  };
};
