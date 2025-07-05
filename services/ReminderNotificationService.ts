import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { buildNotificationContent } from './NotificationContentBuilder';

export interface ReminderTime {
  id: string;
  time: string; // HH:mm string (24-hour)
  label: string;
  enabled: boolean;
  isCustom?: boolean;
}

const NOTIF_KEY_PREFIX = 'reminder_notification_id_';

/**
 * Ensure the app has permission to send notifications. If permission has not
 * yet been requested, this will prompt the user (once). Returns `true` if the
 * permission is granted, otherwise `false`.
 */
async function ensureNotificationPermission(): Promise<boolean> {
  const existingStatus = await Notifications.getPermissionsAsync();
  if (existingStatus.status === 'granted') return true;

  const request = await Notifications.requestPermissionsAsync();
  return request.status === 'granted';
}

/**
 * Cancel a scheduled notification by its identifier and remove the mapping
 * entry from `AsyncStorage`.
 */
async function cancelNotification(mappingKey: string, notificationId?: string | null) {
  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (_) {
      // It is fine if the notification no longer exists.
    }
  }
  await AsyncStorage.removeItem(mappingKey).catch(() => undefined);
}

/**
 * Schedule (or reschedule) a daily repeating local notification for a single
 * reminder entry. If the reminder is disabled the function will ensure any
 * existing scheduled notification is cancelled.
 */
async function syncSingleReminder(reminder: ReminderTime) {
  const mappingKey = `${NOTIF_KEY_PREFIX}${reminder.id}`;
  const existingNotificationId = await AsyncStorage.getItem(mappingKey);

  if (!reminder.enabled) {
    // Reminder disabled – make sure nothing is scheduled.
    await cancelNotification(mappingKey, existingNotificationId);
    return;
  }

  // Reminder enabled – (re)schedule the notification.
  // Always cancel the existing one first so we never have duplicates.
  if (existingNotificationId) {
    await cancelNotification(mappingKey, existingNotificationId);
  }

  const [hourStr, minuteStr] = reminder.time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  const newId = await Notifications.scheduleNotificationAsync({
    content: buildNotificationContent(reminder.label, reminder.time),
    // Using the daily trigger pattern provided by expo-notifications
    trigger: { hour, minute, repeats: true },
  });

  await AsyncStorage.setItem(mappingKey, newId);
}

/**
 * Synchronize the local notification schedule with the current set of
 * reminders. This function is idempotent – calling it multiple times with the
 * same `reminders` array will not create duplicate notifications.
 */
export async function syncReminderNotifications(reminders: ReminderTime[]) {
  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return; // Early exit – nothing to do without permission

  // First, create a Set of the current reminder IDs for quick lookup.
  const currentIds = new Set(reminders.map((r) => r.id));

  // Cancel notifications that belong to reminders that were deleted.
  const allKeys = await AsyncStorage.getAllKeys();
  const mappingKeys = allKeys.filter((k) => k.startsWith(NOTIF_KEY_PREFIX));

  await Promise.all(
    mappingKeys.map(async (key) => {
      const id = key.replace(NOTIF_KEY_PREFIX, '');
      if (!currentIds.has(id)) {
        const notifId = await AsyncStorage.getItem(key);
        await cancelNotification(key, notifId);
      }
    })
  );

  // Now (re)schedule notifications for each current reminder.
  for (const reminder of reminders) {
    await syncSingleReminder(reminder);
  }
} 