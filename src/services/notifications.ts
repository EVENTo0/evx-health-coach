/**
 * EVX Notifications Service
 * Handles push notification scheduling, permissions, and local alerts.
 * Uses expo-notifications for both local + push.
 */

// @ts-ignore — installed at build time
import * as Notifications from 'expo-notifications';
// @ts-ignore — installed at build time
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
      body: 'Your daily plan is ready. Start strong.',
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
          body: 'Stay ahead of your water goal. Drink up!',
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
// Cancel all
// ----------------------------------------------------------------
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
