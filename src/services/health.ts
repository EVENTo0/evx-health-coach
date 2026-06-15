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
