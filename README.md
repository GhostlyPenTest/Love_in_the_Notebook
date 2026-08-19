# love in the notebook 📓

the notebook we keep passing back n forth — a shared Android app for two people.

## stack

- Expo (SDK 57) + React Native + TypeScript, file-based routing via `expo-router`
- Firebase: Firestore (data sync), Auth (anonymous, paired by a 6-character code), Cloud Messaging via Expo push notifications
- EAS for cloud builds — no local Android Studio needed
- `react-native-svg` for the paper/pencil visual system (ruled lines, hand-drawn wobble borders, doodles)

## project structure

```
src/
  app/                 expo-router screens (file-based routing)
    (notebook)/         the tabbed pages: status, mood, journal, voice, games
    game/                the four individual games
  components/
    paper/               shared visual kit: PaperBackground, PencilCard/Button/Text, NotebookScreen
    doodles/             ambient doodle layer + the two doodle sets
    reveal/              <MutualReveal> UI shell
    spark/               <SparkMeter> (V2 seed visual)
  lib/
    firebase/            Firebase init, anonymous auth + pairing-code flow, typed Firestore refs
    reveal/               useMutualReveal -- the submit/lock/reveal engine
    couple/              CoupleProvider -- resolves signed-in user, couple, partner
    games/               per-game logic + the shared useGameSession hook
    spark/                spark-points pipeline (event -> increment -> threshold)
    push/                Expo push token registration + sending
  constants/
    copy.ts              every user-facing string, in voice, in one place
    theme.ts             paper colors, spacing, fonts
    firestorePaths.ts     every Firestore path, in one place
  types/models.ts        the full data model
firestore.rules          security rules -- see the comments at the top for the trust model
```

## first-time setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Firebase project** (already created: `love-in-the-notebook`)
   - Firestore, Auth (Anonymous sign-in), and Storage should all be in **locked/production mode** -- never test mode.
   - `google-services.json` is already in the repo root and wired into `app.json` (`android.googleServicesFile`).
   - Copy `.env.example` to `.env` and fill in the Web app's config from Firebase console → Project settings → Your apps → the `</>` web app. (This is separate from the Android app's `google-services.json` values -- the JS SDK used here authenticates as the Web platform app.)
   - Deploy the security rules before the app can read/write anything:
     ```bash
     firebase deploy --only firestore:rules
     ```

3. **EAS** (for push notifications + cloud builds)
   ```bash
   npx eas login
   npx eas init
   ```
   Put the resulting project ID in `.env` as `EXPO_PUBLIC_EAS_PROJECT_ID` (or it'll fall back to `app.json`'s `extra.eas.projectId` if `eas init` already wrote it there).

4. **Run it**
   ```bash
   npx expo start
   ```
   Scan the QR code with Expo Go, or run a dev build via `npx eas build --profile development --platform android`.

## V1 scope vs. what's deferred to V2

- **Voice Notes** and **Journal photos** are deferred to V2: Firebase Storage now requires the Blaze (pay-as-you-go) plan rather than being free on Spark, and the call was made to hold off on enabling billing for V1. The data model (`VoiceNote`, `JournalContent.photoUrl`) and the Voice Notes tab are still in place so V2 just wires in the upload flow rather than rebuilding the feature.
- **Home-screen widget** for Status: deferred. A real Android widget needs native code and a custom dev client (no more Expo Go), which is a bigger call than V1's scope -- Status is fully functional in-app in the meantime.
- **Spark points**: the V1 seed is live (every signal/mood/journal/game-move increments a shared counter, with a small threshold-based sprite visual) but there's no colony/settlement game yet -- that's the whole point of the seed, so V2 can build on `sparkPoints/{coupleId}` without a rewrite.

## a couple of architecture notes worth knowing before touching this

- **Mutual Reveal hiding is enforced by Firestore rules, not the UI.** Each entry (mood/journal/trivia) is a small "meta" doc (who's submitted, when it revealed) plus a `submissions/{uid}` subcollection where the actual content lives. A submission is only readable by its own author until the meta doc's `revealedAt` is set -- see `firestore.rules`.
- **No backend server.** Push notifications are sent client-to-client via Expo's push HTTP API directly, and Battleship's hit/miss resolution is done by the defender's own client (their device is the only one allowed to read their own ship placement). Both are documented trust trade-offs of having zero server-side code in V1, not oversights.
- **`firebase/auth` vs `@firebase/auth`**: this app imports Auth APIs from the scoped `@firebase/auth` package, not the `firebase/auth` convenience wrapper -- see the comment in `src/lib/firebase/init.ts` for why (the wrapper's package.json doesn't route to the React Native build in this SDK version, which silently breaks AsyncStorage-backed session persistence).
