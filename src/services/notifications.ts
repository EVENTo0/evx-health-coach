/**
 * EVX Notifications Service
 * Handles push notification scheduling, permissions, and local alerts.
 * Uses expo-notifications for both local + push.
 */

// @ts-ignore -- installed at build time
import * as Notifications from 'expo-notifications';
// @ts-ignore -- installed at build time
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ----------------------------------------------------------------
// Permissions
// ----------------------------------------------------------------
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Device.isDevice) return false; // Simulators don't support push

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const getExpoPushToken = async (): Promise<string | null> => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return token.data;
  } catch {
    return null;
  }
};

// ----------------------------------------------------------------
// Schedule daily reminders
// ----------------------------------------------------------------
export const scheduleDailyReminders = async (config: {
  workoutTime: string;   // "HH:MM"
  mealReminders: boolean;
  waterReminders: boolean;
  sleepReminder: string; // "HH:MM"
}): Promise<void> => {
  // Cancel all existing scheduled notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [workoutHour, workoutMin] = config.workoutTime.split(':').map(Number);

  // 1. Workout reminder
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💪 Time to train, Champion!',
      body: 'Your workout is ready. Let\'s build something great today.',
      data: { screen: 'Workout' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: workoutHour,
      minute: workoutMin,
    },
  });

  // 2. Morning check-in (7 AM)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌅 Good morning!',
      body: `Your daily plan is ready. Start strong.`,
      data: { screen: 'DailyPlan' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 7,
      minute: 0,
    },
  });

  // 3. Water reminders (every 2 hours, 8 AM – 8 PM)
  if (config.waterReminders) {
    const waterHours = [8, 10, 12, 14, 16, 18, 20];
    for (const hour of waterHours) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Hydration check',
          body: `Stay ahead of your water goal. Drink up.`,
          data: { screen: 'Dashboard' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
        },
      });
    }
  }

  // 4. Meal reminders
  if (config.mealReminders) {
    const meals = [
      { hour: 8, minute: 0, name: 'Breakfast' },
      { hour: 13, minute: 0, name: 'Lunch' },
      { hour: 19, minute: 0, name: 'Dinner' },
    ];
    for (const meal of meals) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🍽️ ${meal.name} time`,
          body: 'Your meal plan is ready. Fuel your body right.',
          data: { screen: 'Nutrition' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: meal.hour,
          minute: meal.minute,
        },
      });
    }
  }

  // 5. Sleep reminder
  const [sleepHour, sleepMin] = config.sleepReminder.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 Wind down time',
      body: 'Protect your recovery. Great sleep = better results tomorrow.',
      data: { screen: 'Progress' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: sleepHour,
      minute: sleepMin,
    },
  });
};

// ----------------------------------------------------------------
// Streak notifications
// ----------------------------------------------------------------
export const scheduleStreakCelebration = async (streakDays: number): Promise<void> => {
  const milestones: Record<number, string> = {
    3: '🔥 3-day streak! You\'re building a real habit.',
    7: '⚡ One full week! You\'re on fire.',
    14: '🏆 Two weeks strong! Elite consistency.',
    30: '💎 30-day streak! You\'re unstoppable.',
    90: '🚀 90 days. You\'ve changed your life.',
  };

  const message = milestones[streakDays];
  if (!message) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎯 Streak milestone: ${streakDays} days!`,
      body: message,
      data: { screen: 'Progress' },
    },
    trigger: null, // Immediate
  });
};


// ----------------------------------------------------------------
// Smart Scheduling -- adapts to user's actual health profile times
// ----------------------------------------------------------------
export interface SmartNotificationConfig {
  workoutStartTime: string;  // "HH:MM" from health profile
  workoutEndTime: string;    // "HH:MM"
  workSleepHours: number;    // target sleep hours
  mealReminders: boolean;
  waterReminders: boolean;
  symptomCheckIn: boolean;   // morning symptom reminder
  trainingDays: number[];    // 0=Sun ... 6=Sat
}

export const scheduleSmartReminders = async (cfg: SmartNotificationConfig): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [wkStartH, wkStartM] = cfg.workoutStartTime.split(':').map(Number);
  const remindH = wkStartH > 0 ? wkStartH - 1 : 0; // 1 hour before workout

  // Workout prep -- only on training days
  if (cfg.trainingDays.length > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💪 Workout in 1 hour!',
        body: `Prep your gear, hydrate, and warm up. Let's go.`,
        data: { screen: 'Workout' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: (cfg.trainingDays[0] % 7) + 1, // iOS weekday 1=Sun
        hour: remindH,
        minute: wkStartM,
      },
    });
  }

  // Morning dashboard + symptom check-in -- 30 min after wake (estimate: 7 AM)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: cfg.symptomCheckIn ? '🌅 Good morning! How do you feel?' : '🌅 Good morning!',
      body: cfg.symptomCheckIn
        ? `Log your symptoms so your AI coach can adapt today's plan.`
        : `Your daily plan is ready. Start strong.`,
      data: { screen: cfg.symptomCheckIn ? 'Dashboard' : 'DailyPlan' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 7, minute: 30 },
  });

  // Meal reminders -- timed relative to workout window
  if (cfg.mealReminders) {
    const [wkEndH] = cfg.workoutEndTime.split(':').map(Number);
    const dinnerH = Math.min(wkEndH + 1, 20); // 1 hr post-workout or 8 PM max
    const lunches = [{ hour: 13, minute: 0 }];
    const dinners = [{ hour: dinnerH, minute: 0 }];

    await Notifications.scheduleNotificationAsync({
      content: { title: '🌅 Breakfast time', body: `Fuel up right. Check your meal plan.`, data: { screen: 'Nutrition' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 8, minute: 0 },
    });
    for (const m of [...lunches, ...dinners]) {
      await Notifications.scheduleNotificationAsync({
        content: { title: '🍽️ Meal reminder', body: `Stay on track with your nutrition plan.`, data: { screen: 'Nutrition' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: m.hour, minute: m.minute },
      });
    }
  }

  // Water reminders -- every 2 hours during waking hours
  if (cfg.waterReminders) {
    for (const hour of [8, 10, 12, 14, 16, 18, 20]) {
      await Notifications.scheduleNotificationAsync({
        content: { title: '💧 Hydration check', body: `Stay ahead of your water goal. Drink up.`, data: { screen: 'Dashboard' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
      });
    }
  }

  // Sleep wind-down -- back-calculated from target sleep hours (assume 6 AM wake = sleep at 10 PM default)
  const targetBedHour = Math.max(22 - Math.max(cfg.workSleepHours - 8, 0), 20);
  await Notifications.scheduleNotificationAsync({
    content: { title: '🌙 Wind down', body: `Protect your recovery. Sleep = better results.`, data: { screen: 'Progress' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: targetBedHour, minute: 0 },
  });

  // Progress log reminder -- every evening at 8:30 PM
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Log todays progress', body: `Capture your weight, energy & mood before the day ends.`, data: { screen: 'Progress' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 30 },
  });
};

// ----------------------------------------------------------------
// Boot: apply smart schedule from stored health profile
// ----------------------------------------------------------------
export const applySmartScheduleFromProfile = async (profile: {
  training_start_time: string;
  training_end_time: string;
  sleep_hours_target: number;
  training_days: number[];
}): Promise<void> => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await scheduleSmartReminders({
    workoutStartTime: profile.training_start_time || '07:00',
    workoutEndTime: profile.training_end_time || '08:30',
    workSleepHours: profile.sleep_hours_target || 7,
    mealReminders: true,
    waterReminders: true,
    symptomCheckIn: true,
    trainingDays: profile.training_days || [1, 3, 5],
  });
};

// ----------------------------------------------------------------
// Cancel all
// ----------------------------------------------------------------
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
