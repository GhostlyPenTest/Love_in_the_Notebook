import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { easProjectId } from '@/lib/firebase/config';

/**
 * No backend server in V1 -- each partner's device calls Expo's push HTTP
 * API directly to notify the other, using their stored expoPushToken. That
 * means anyone holding a partner's token could send them a bogus
 * notification; acceptable for a two-person V1 with no server, but worth
 * hardening (e.g. a Cloud Function relay) if this ever needs to resist a
 * malicious client rather than just route notifications between two people
 * who trust each other.
 *
 * `expo-notifications` is loaded lazily and skipped entirely when running in
 * Expo Go: as of SDK 53, remote push was removed from Expo Go, and merely
 * evaluating the module logs a load-time error there (a bare try/catch
 * around the import doesn't stop it -- Metro's module system reports the
 * failure itself before a promise even resolves/rejects, and the resulting
 * module object is broken rather than absent, so a null-check on the
 * import result isn't reliable either). Checking `Constants.expoGoConfig`
 * up front avoids ever touching the module there. Real push still works
 * fine in a dev/production build; Expo Go just degrades to "no push,"
 * quietly.
 */

const isExpoGo = Constants.expoGoConfig != null;

let cachedModule: typeof import('expo-notifications') | null | undefined;

async function loadNotifications(): Promise<typeof import('expo-notifications') | null> {
  if (isExpoGo) return null;
  if (cachedModule !== undefined) return cachedModule;
  try {
    cachedModule = await import('expo-notifications');
  } catch (err) {
    console.warn('[push] expo-notifications failed to load:', err);
    cachedModule = null;
  }
  return cachedModule;
}

export async function configureNotificationHandler(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 120, 200],
        lightColor: '#3E6FA6',
      });
    }

    if (!Device.isDevice) {
      console.warn('[push] Push notifications need a physical device (or a dev/production build).');
      return null;
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    const projectId =
      easProjectId ||
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    if (!projectId) {
      console.warn('[push] Missing EXPO_PUBLIC_EAS_PROJECT_ID -- run `eas init` and set it in .env.');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (err) {
    console.warn('[push] Failed to register for push notifications', err);
    return null;
  }
}

interface SendPushParams {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification({ to, title, body, data }: SendPushParams): Promise<void> {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, title, body, data, sound: 'default' }),
    });
  } catch (err) {
    // Best-effort: the in-app Firestore listeners are the source of truth,
    // push is just a nudge. Never block a feature action on this succeeding.
    console.warn('[push] send failed', err);
  }
}
