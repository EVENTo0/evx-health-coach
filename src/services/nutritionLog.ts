import { supabase } from './supabase';

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  calories_actual: number;
  protein_actual_g: number;
  carbs_actual_g: number;
  fat_actual_g: number;
  water_actual_liters: number;
  meal_name?: string;
  notes?: string;
  created_at: string;
}

export interface DailyMacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_liters: number;
}

export const nutritionLogService = {
  async getTodayLogs(userId: string, date: string): Promise<NutritionLog[]> {
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async addEntry(entry: Omit<NutritionLog, 'id' | 'created_at'>): Promise<NutritionLog> {
    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert(entry)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteEntry(id: string): Promise<void> {
    const { error } = await supabase.from('nutrition_logs').delete().eq('id', id);
    if (error) throw error;
  },

  getTotals(logs: NutritionLog[]): DailyMacroTotals {
    return logs.reduce(
      (acc, l) => ({
        calories: acc.calories + (l.calories_actual ?? 0),
        protein_g: acc.protein_g + (l.protein_actual_g ?? 0),
        carbs_g: acc.carbs_g + (l.carbs_actual_g ?? 0),
        fat_g: acc.fat_g + (l.fat_actual_g ?? 0),
        water_liters: acc.water_liters + (l.water_actual_liters ?? 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, water_liters: 0 }
    );
  },
};
