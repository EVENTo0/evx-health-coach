/**
 * EVX Health Integration Service
 *
 * Reads health data from:
 *   - Apple HealthKit (iOS) via expo-health
 *   - Google Health Connect (Android) via react-native-health-connect
 *
 * Both native modules are OPTIONAL — the app builds and runs without them.
 * They are resolved at runtime via require() inside try/catch so Metro
 * never throws "module not found" during the bundle phase.
 */

import { Platform } from 'react-native';

export interface HealthSnapshot {
  steps?: number;
  activeCalories?: number;
  restingHeartRate?: number;
  sleepHours?: number;
  weight?: number;
  date: string;
}

const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

// ----------------------------------------------------------------
// iOS — HealthKit via expo-health (optional)
// ----------------------------------------------------------------
const readHealthKitData = async (date: string): Promise<HealthSnapshot> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Health = require('expo-health');
    const available = await Health.isAvailableAsync?.();
    if (!available) return { date };

    await Health.requestPermissionsAsync?.([
      Health.HealthDataType?.Steps,
      Health.HealthDataType?.ActiveEnergyBurned,
      Health.HealthDataType?.HeartRate,
      Health.HealthDataType?.SleepAnalysis,
      Health.HealthDataType?.Weight,
    ]);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [steps, calories, heartRate, sleep, weight] = await Promise.allSettled([
      Health.getStatisticsSampleAsync?.(Health.HealthDataType.Steps, {
        from: startOfDay, to: endOfDay, aggregation: 'sum',
      }),
      Health.getStatisticsSampleAsync?.(Health.HealthDataType.ActiveEnergyBurned, {
        from: startOfDay, to: endOfDay, aggregation: 'sum',
      }),
      Health.getStatisticsSampleAsync?.(Health.HealthDataType.HeartRate, {
        from: startOfDay, to: endOfDay, aggregation: 'mostRecent',
      }),
      Health.getStatisticsSampleAsync?.(Health.HealthDataType.SleepAnalysis, {
        from: new Date(new Date(date).setHours(-8, 0, 0, 0)), to: startOfDay,
        aggregation: 'sum',
      }),
      Health.getStatisticsSampleAsync?.(Health.HealthDataType.Weight, {
        from: startOfDay, to: endOfDay, aggregation: 'mostRecent',
      }),
    ]);

    return {
      date,
      steps:            steps.status === 'fulfilled'     ? (steps.value as any)?.quantity ?? undefined : undefined,
      activeCalories:   calories.status === 'fulfilled'  ? (calories.value as any)?.quantity ?? undefined : undefined,
      restingHeartRate: heartRate.status === 'fulfilled' ? (heartRate.value as any)?.quantity ?? undefined : undefined,
      sleepHours:       sleep.status === 'fulfilled' && (sleep.value as any)?.quantity
                          ? +((sleep.value as any).quantity / 3600).toFixed(1)
                          : undefined,
      weight:           weight.status === 'fulfilled'    ? (weight.value as any)?.quantity ?? undefined : undefined,
    };
  } catch {
    return { date };
  }
};

// ----------------------------------------------------------------
// Android — Health Connect (optional)
// ----------------------------------------------------------------
const readHealthConnectData = async (date: string): Promise<HealthSnapshot> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const HC = require('react-native-health-connect');
    const initialized = await HC.initialize?.();
    if (!initialized) return { date };

    await HC.requestPermission?.([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'Weight' },
    ]);

    const startTime = `${date}T00:00:00.000Z`;
    const endTime   = `${date}T23:59:59.999Z`;
    const filter    = { timeRangeFilter: { operator: 'between', startTime, endTime } };

    const [steps, calories] = await Promise.allSettled([
      HC.readRecords?.('Steps', filter),
      HC.readRecords?.('ActiveCaloriesBurned', filter),
    ]);

    const totalSteps = steps.status === 'fulfilled'
      ? ((steps.value as any)?.records ?? []).reduce((s: number, r: any) => s + (r.count ?? 0), 0)
      : undefined;

    const totalCalories = calories.status === 'fulfilled'
      ? ((calories.value as any)?.records ?? []).reduce((s: number, r: any) => s + (r.energy?.inKilocalories ?? 0), 0)
      : undefined;

    return { date, steps: totalSteps, activeCalories: totalCalories };
  } catch {
    return { date };
  }
};

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------
export const readTodayHealthData = async (): Promise<HealthSnapshot> => {
  const today = new Date().toISOString().split('T')[0];
  if (isIOS)     return readHealthKitData(today);
  if (isAndroid) return readHealthConnectData(today);
  return { date: today };
};

export const readHealthDataForDate = async (date: string): Promise<HealthSnapshot> => {
  if (isIOS)     return readHealthKitData(date);
  if (isAndroid) return readHealthConnectData(date);
  return { date };
};

export const isHealthIntegrationAvailable = async (): Promise<boolean> => {
  try {
    if (isIOS) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Health = require('expo-health');
      return !!(await Health.isAvailableAsync?.());
    }
    if (isAndroid) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const HC = require('react-native-health-connect');
      return !!(await HC.initialize?.());
    }
    return false;
  } catch {
    return false;
  }
};

// ----------------------------------------------------------------
// Extended Wearable Sync — stores daily snapshot in Supabase
// ----------------------------------------------------------------
import { supabase } from './supabase';

export interface WearableSnapshot extends HealthSnapshot {
  hrv_ms?: number;        // Heart Rate Variability (ms)
  vo2_max?: number;       // VO2 Max estimate (ml/kg/min)
  blood_oxygen?: number;  // SpO2 %
  floors_climbed?: number;
  distance_km?: number;
}

/**
 * Read extended health data and persist it to the wearable_snapshots table.
 * Merges the base HealthSnapshot with extra metrics when available.
 */
export const syncWearableSnapshot = async (userId: string): Promise<WearableSnapshot | null> => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const base = await readTodayHealthData();
    if (!base.steps && !base.activeCalories && !base.restingHeartRate && !base.sleepHours) {
      // No wearable data available on this device — skip
      return null;
    }

    const snapshot: WearableSnapshot = { ...base, date: today };

    // Persist to Supabase (upsert by user + date)
    const { error } = await supabase
      .from('wearable_snapshots')
      .upsert(
        {
          user_id: userId,
          date: today,
          steps: snapshot.steps,
          active_calories: snapshot.activeCalories,
          resting_heart_rate: snapshot.restingHeartRate,
          sleep_hours: snapshot.sleepHours,
          weight_kg: snapshot.weight,
          hrv_ms: snapshot.hrv_ms,
          vo2_max: snapshot.vo2_max,
          blood_oxygen: snapshot.blood_oxygen,
          floors_climbed: snapshot.floors_climbed,
          distance_km: snapshot.distance_km,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' }
      );

    if (error) console.warn('Wearable sync error:', error.message);
    return snapshot;
  } catch (e) {
    console.warn('syncWearableSnapshot failed:', e);
    return null;
  }
};

/**
 * Get the last N days of wearable snapshots for charts / AI context
 */
export const getWearableHistory = async (userId: string, days = 14): Promise<WearableSnapshot[]> => {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const { data, error } = await supabase
    .from('wearable_snapshots')
    .select('*')
    .eq('user_id', userId)
    .gte('date', from.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) return [];
  return (data ?? []).map((r: any) => ({
    date: r.date,
    steps: r.steps,
    activeCalories: r.active_calories,
    restingHeartRate: r.resting_heart_rate,
    sleepHours: r.sleep_hours,
    weight: r.weight_kg,
    hrv_ms: r.hrv_ms,
    vo2_max: r.vo2_max,
    blood_oxygen: r.blood_oxygen,
    floors_climbed: r.floors_climbed,
    distance_km: r.distance_km,
  }));
};
