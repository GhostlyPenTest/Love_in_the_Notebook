import AsyncStorage from '@react-native-async-storage/async-storage';
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Firestore, initializeFirestore } from 'firebase/firestore';
import { type FirebaseStorage, getStorage } from 'firebase/storage';

// NOTE: importing from the `@firebase/auth` scoped package, not the
// `firebase/auth` convenience wrapper. In the installed SDK version the
// wrapper's `./auth` export map has no `react-native` condition, so it
// silently resolves (types AND Metro's runtime resolution) to the generic
// browser build -- which has no getReactNativePersistence and no working
// AsyncStorage-backed persistence. @firebase/auth's own export map does
// have a correct react-native condition. See lib/firebase/auth.ts for the
// same import convention.
import { type Auth, getAuth, initializeAuth } from '@firebase/auth';
// @ts-expect-error -- getReactNativePersistence exists at runtime (dist/rn/index.js, matched
// via the "react-native" export condition) but @firebase/auth's package.json exports map
// resolves TYPES through a `types` key that always points at the universal auth-public.d.ts,
// which doesn't declare this RN-only export. Known upstream SDK quirk, not a bug in this app --
// remove this suppression once a future firebase version fixes the types map.
import { getReactNativePersistence } from '@firebase/auth';

import { firebaseConfig } from './config';

// Guard against re-initializing on Fast Refresh.
export const firebaseApp: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

let _auth: Auth;
try {
  _auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // initializeAuth throws if already called (Fast Refresh) -- fall back to the existing instance.
  _auth = getAuth(firebaseApp);
}
export const auth: Auth = _auth;

// long-polling avoids some flaky-network edge cases with the default WebChannel
// transport on Android/Expo Go; auto-detect keeps it from slowing down where not needed.
export const db: Firestore = initializeFirestore(firebaseApp, {
  experimentalAutoDetectLongPolling: true,
});

export const storage: FirebaseStorage = getStorage(firebaseApp);
