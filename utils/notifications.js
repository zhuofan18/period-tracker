import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions() {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getPermissionStatus() {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// Cancel all scheduled notifications with a given tag
async function cancelByTag(tag) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.tag === tag) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

export async function schedulePeriodReminder(nextPeriodDateStr) {
  await cancelByTag('period_reminder');
  if (!nextPeriodDateStr) return;

  const fireDate = new Date(nextPeriodDateStr);
  fireDate.setDate(fireDate.getDate() - 2);
  fireDate.setHours(9, 0, 0, 0);

  if (fireDate <= new Date()) return; // already passed

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Period starting soon 🩸',
      body: 'Your period is predicted to start in 2 days. Stock up on what you need!',
      data: { tag: 'period_reminder' },
    },
    trigger: { date: fireDate },
  });
}

export async function scheduleOvulationAlert(lastPeriodStartStr, cycleLength = 28) {
  await cancelByTag('ovulation_alert');
  if (!lastPeriodStartStr) return;

  const start = new Date(lastPeriodStartStr);
  const ovulationDate = new Date(start);
  ovulationDate.setDate(start.getDate() + 13); // day 14 = index 13
  ovulationDate.setHours(9, 0, 0, 0);

  if (ovulationDate <= new Date()) {
    // Schedule for next cycle
    ovulationDate.setDate(ovulationDate.getDate() + cycleLength);
  }

  if (ovulationDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Ovulation day 🌸",
      body: "Today is your predicted ovulation day — peak fertility!",
      data: { tag: 'ovulation_alert' },
    },
    trigger: { date: ovulationDate },
  });
}

export async function scheduleDailyLogReminder() {
  await cancelByTag('daily_log');

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily log reminder 📝',
      body: "Don't forget to log how you're feeling today!",
      data: { tag: 'daily_log' },
    },
    trigger: {
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });
}

export async function cancelPeriodReminder()  { await cancelByTag('period_reminder'); }
export async function cancelOvulationAlert()  { await cancelByTag('ovulation_alert'); }
export async function cancelDailyLogReminder(){ await cancelByTag('daily_log'); }
