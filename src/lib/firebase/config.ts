/**
 * Reads Firebase web config from EXPO_PUBLIC_* env vars (see .env.example).
 * Expo inlines these at build time -- see https://docs.expo.dev/guides/environment-variables/
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    // Loud on purpose: a silently-empty Firebase config fails in confusing ways
    // deep inside the SDK instead of here, where it's obvious what's missing.
    console.warn(
      `[firebase/config] Missing ${name}. Copy .env.example to .env and fill in your ` +
        'Firebase project config, then restart the dev server.'
    );
  }
  return value ?? '';
}

export const firebaseConfig = {
  apiKey: required('EXPO_PUBLIC_FIREBASE_API_KEY', process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: required(
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  ),
  projectId: required(
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
  ),
  storageBucket: required(
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  ),
  messagingSenderId: required(
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  ),
  appId: required('EXPO_PUBLIC_FIREBASE_APP_ID', process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
};

export const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '';
