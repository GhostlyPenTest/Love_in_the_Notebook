import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
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
 */

export function configureNotificationHandler() {
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
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#3E6FA6',
    });
  }

  if (!Device.isDevice) {
    console.warn('[push] Push notifications need a physical device (or Expo Go with EAS build).');
    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') {
    return null;
  }

  const projectId = easProjectId || (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  if (!projectId) {
    console.warn('[push] Missing EXPO_PUBLIC_EAS_PROJECT_ID -- run `eas init` and set it in .env.');
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (err) {
    console.warn('[push] Failed to get Expo push token', err);
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
