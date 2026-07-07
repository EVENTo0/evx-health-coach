import { createClient } from '@supabase/supabase-js';

const URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const KEY  = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string;

export const supabase = createClient(URL, KEY);
export type Category = 'nutrition' | 'training' | 'recovery' | 'mindset' | 'labs' | 'general';

export interface Article {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: Category;
  emoji: string;
  read_time_minutes: number;
  tags: string[];
  author: string;
  featured: boolean;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'premium_monthly' | 'premium_annual';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  purchase_token: string | null;
  expires_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}
