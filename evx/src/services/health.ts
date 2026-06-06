/**
 * EVX Health Integration Service
 * 
 * Reads health data from:
 *   - Apple HealthKit (iOS) via expo-health
 *   - Google Fit / Health Connect (Android)
 * 
 * Falls back gracefully when unavailable (simulator, permissions denied).
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

// ----------------------------------------------------------------
// Platform detection
// ----------------------------------------------------------------
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

// ----------------------------------------------------------------
// iOS — HealthKit via expo-health (install: expo install expo-health)
// ----------------------------------------------------------------
const readHealthKitData = async (date: string): Promise<HealthSnapshot> => {
  try {
    // @ts-ignore — optional native module
    const { default: Health } = await import('expo-health' as string) as any;

    const available = await Health.isAvailableAsync();
    if (!available) return { date };

    await Health.requestPermissionsAsync([
      Health.HealthDataType.Steps,
      Health.HealthDataType.ActiveEnergyBurned,
      Health.HealthDataType.HeartRate,
      Health.HealthDataType.SleepAnalysis,
      Health.HealthDataType.Weight,
    ]);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [steps, calories, heartRate, sleep, weight] = await Promise.allSettled([
      Health.getStatisticsSampleAsync(Health.HealthDataType.Steps, {
        from: startOfDay, to: endOfDay, aggregation: 'sum',
      }),
      Health.getStatisticsSampleAsync(Health.HealthDataType.ActiveEnergyBurned, {
        from: startOfDay, to: endOfDay, aggregation: 'sum',
      }),
      Health.getStatisticsSampleAsync(Health.HealthDataType.HeartRate, {
        from: startOfDay, to: endOfDay, aggregation: 'mostRecent',
      }),
      Health.getStatisticsSampleAsync(Health.HealthDataType.SleepAnalysis, {
        from: new Date(new Date(date).setHours(-8, 0, 0, 0)), to: startOfDay,
        aggregation: 'sum',
      }),
      Health.getStatisticsSampleAsync(Health.HealthDataType.Weight, {
        from: startOfDay, to: endOfDay, aggregation: 'mostRecent',
      }),
    ]);

    return {
      date,
      steps: steps.status === 'fulfilled' ? steps.value?.quantity ?? undefined : undefined,
      activeCalories: calories.status === 'fulfilled' ? calories.value?.quantity ?? undefined : undefined,
      restingHeartRate: heartRate.status === 'fulfilled' ? heartRate.value?.quantity ?? undefined : undefined,
      sleepHours: sleep.status === 'fulfilled' && sleep.value?.quantity
        ? +(sleep.value.quantity / 3600).toFixed(1)
        : undefined,
      weight: weight.status === 'fulfilled' ? weight.value?.quantity ?? undefined : undefined,
    };
  } catch {
    return { date };
  }
};

// ----------------------------------------------------------------
// Android — Health Connect via react-native-health-connect
// ----------------------------------------------------------------
const readHealthConnectData = async (date: string): Promise<HealthSnapshot> => {
  try {
    // @ts-ignore — optional native module
    const HC = await import('react-native-health-connect' as string) as any;

    const initialized = await HC.initialize();
    if (!initialized) return { date };

    await HC.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'Weight' },
    ]);

    const startTime = `${date}T00:00:00.000Z`;
    const endTime = `${date}T23:59:59.999Z`;

    const [steps, calories] = await Promise.allSettled([
      HC.readRecords('Steps', { timeRangeFilter: { operator: 'between', startTime, endTime } }),
      HC.readRecords('ActiveCaloriesBurned', { timeRangeFilter: { operator: 'between', startTime, endTime } }),
    ]);

    const totalSteps = steps.status === 'fulfilled'
      ? (steps.value.records as Array<{ count: number }>).reduce((sum, r) => sum + r.count, 0)
      : undefined;

    const totalCalories = calories.status === 'fulfilled'
      ? (calories.value.records as Array<{ energy: { inKilocalories: number } }>)
          .reduce((sum, r) => sum + r.energy.inKilocalories, 0)
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
  if (isIOS) return readHealthKitData(today);
  if (isAndroid) return readHealthConnectData(today);
  return { date: today };
};

export const readHealthDataForDate = async (date: string): Promise<HealthSnapshot> => {
  if (isIOS) return readHealthKitData(date);
  if (isAndroid) return readHealthConnectData(date);
  return { date };
};

export const isHealthIntegrationAvailable = async (): Promise<boolean> => {
  try {
    if (isIOS) {
      // @ts-ignore — optional native module
    const { default: Health } = await import('expo-health' as string) as any;
      return Health.isAvailableAsync();
    }
    if (isAndroid) {
      // @ts-ignore — optional native module
    const HC = await import('react-native-health-connect' as string) as any;
      return HC.initialize();
    }
    return false;
  } catch {
    return false;
  }
};
