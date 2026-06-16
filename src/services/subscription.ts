/**
 * EVX Subscription Service
 * Manages premium subscription state via Supabase
 * In-app purchase validation is handled server-side via the ai-orchestrator edge function
 */

import { supabase } from './supabase';

export type PlanType = 'free' | 'premium_monthly' | 'premium_annual';

export interface SubscriptionStatus {
  isPremium: boolean;
  plan: PlanType;
  expiresAt: string | null;
  trialEndsAt: string | null;
  isOnTrial: boolean;
}

const DEFAULT_STATUS: SubscriptionStatus = {
  isPremium: false,
  plan: 'free',
  expiresAt: null,
  trialEndsAt: null,
  isOnTrial: false,
};

export const PLANS = {
  monthly: {
    id: 'evx_premium_monthly',
    label: 'Monthly',
    price: '$9.99',
    period: 'month',
    description: 'Billed monthly',
    saving: null,
  },
  annual: {
    id: 'evx_premium_annual',
    label: 'Annual',
    price: '$59.99',
    period: 'year',
    description: 'Billed yearly — save 50%',
    saving: '50%',
  },
};

export const PREMIUM_FEATURES = [
  { icon: '🏋️', title: 'AI Workout Generation', description: 'Personalized workouts built by AI' },
  { icon: '🥗', title: 'AI Nutrition Plans', description: 'Custom meal plans for your goals' },
  { icon: '🧪', title: 'Lab Report Analysis', description: 'Upload & get AI insights on your labs' },
  { icon: '📅', title: 'Daily Planning', description: 'AI-powered daily schedule optimization' },
  { icon: '📊', title: 'Advanced Analytics', description: 'Deep progress tracking & trends' },
  { icon: '🌙', title: 'Dark & Light Mode', description: 'Premium look and feel' },
];

/**
 * Fetch subscription status from Supabase for the current user
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULT_STATUS;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return DEFAULT_STATUS;

    const now = new Date();
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
    const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;

    const isOnTrial = trialEndsAt ? trialEndsAt > now : false;
    const isActive = expiresAt ? expiresAt > now : false;
    const isPremium = (isActive || isOnTrial) && data.status === 'active';

    return {
      isPremium,
      plan: data.plan as PlanType,
      expiresAt: data.expires_at,
      trialEndsAt: data.trial_ends_at,
      isOnTrial,
    };
  } catch {
    return DEFAULT_STATUS;
  }
}

/**
 * Start a 7-day free trial for the user
 */
export async function startFreeTrial(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    const { error } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan: 'premium_monthly',
      status: 'active',
      trial_ends_at: trialEnd.toISOString(),
      expires_at: trialEnd.toISOString(),
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Record a successful purchase (called after Google Play purchase validation)
 */
export async function activateSubscription(
  plan: PlanType,
  purchaseToken: string,
  expiresAt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan,
      status: 'active',
      purchase_token: purchaseToken,
      expires_at: expiresAt,
      trial_ends_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
