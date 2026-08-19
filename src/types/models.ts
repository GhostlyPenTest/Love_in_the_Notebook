/**
 * Firestore data model for Love in the Notebook.
 *
 * Collections:
 *  - couples/{coupleId}
 *  - users/{userId}
 *  - moodEntries/{coupleId}/entries/{date}
 *  - journalEntries/{coupleId}/entries/{date}
 *  - voiceNotes/{coupleId}/notes/{noteId}
 *  - signals/{coupleId}/sent/{signalId}
 *  - status/{userId}
 *  - gameSessions/{coupleId}/sessions/{sessionId}
 *  - sparkPoints/{coupleId}
 *
 * `date` keys are `YYYY-MM-DD` in the device's local time zone.
 */

export type UserId = string;
export type CoupleId = string;

/** couples/{coupleId} */
export interface Couple {
  id: CoupleId;
  memberIds: UserId[]; // exactly two once paired, one while waiting
  pairingCode: string; // short code the second partner types in
  createdAt: number; // epoch ms
  createdBy: UserId;
}

/** users/{userId} */
export interface UserProfile {
  id: UserId;
  displayName: string;
  doodleSet: 'floral' | 'arrows'; // which ambient doodle set belongs to this partner
  coupleId: CoupleId | null;
  expoPushToken: string | null;
  createdAt: number;
}

/**
 * Mutual Reveal storage shape. Split across two docs on purpose so hiding is
 * enforced by Firestore rules, not just by the UI choosing not to render it:
 *
 *  - the *meta* doc only ever records WHO has submitted + WHEN it revealed,
 *    never the content itself, so a partner reading it before reveal learns
 *    nothing.
 *  - each partner's actual content lives in their own doc in a `submissions`
 *    subcollection, readable by its owner any time, and by the partner only
 *    once the meta doc's `revealedAt` is set. See firestore.rules.
 */
export interface MutualEntryMeta {
  coupleId: CoupleId;
  key: string; // e.g. date, or sessionId+turn
  submittedBy: Partial<Record<UserId, true>>;
  revealedAt: number | null; // set once both sides are in
}

export interface MutualSubmission<TContent> {
  userId: UserId;
  content: TContent;
  submittedAt: number;
}

export type MoodIcon = 'sunny' | 'foggy' | 'stormy' | 'calm';

export interface MoodContent {
  icon: MoodIcon;
  note?: string;
}
/** moodEntries/{coupleId}/entries/{date} (+ submissions/{uid}) */
export type MoodEntry = MutualEntryMeta;
export type MoodSubmission = MutualSubmission<MoodContent>;

export interface JournalContent {
  text: string;
  photoUrl?: string; // wired up once Storage is enabled in V2 -- see docs/original-prompt.md
}
/** journalEntries/{coupleId}/entries/{date} (+ submissions/{uid}) */
export type JournalEntry = MutualEntryMeta;
export type JournalSubmission = MutualSubmission<JournalContent>;

/** voiceNotes/{coupleId}/notes/{noteId} — free-flowing, not mutual-reveal */
export interface VoiceNote {
  id: string;
  coupleId: CoupleId;
  fromUserId: UserId;
  audioUrl: string;
  durationMs: number;
  createdAt: number;
  listenedAt: number | null;
}

export type SignalType = 'thinking' | 'bad_day' | 'miss_you' | 'good_day';

/** signals/{coupleId}/sent/{signalId} */
export interface Signal {
  id: string;
  coupleId: CoupleId;
  fromUserId: UserId;
  type: SignalType;
  createdAt: number;
  seenAt: number | null;
}

/** status/{userId} */
export interface StatusEntry {
  userId: UserId;
  text: string;
  updatedAt: number;
}

export type GameType = 'tic_tac_toe' | 'word_chain' | 'trivia' | 'battleship';

/** gameSessions/{coupleId}/sessions/{sessionId} — generic shell, per-game `state` shape */
export interface GameSession<TState = unknown> {
  id: string;
  coupleId: CoupleId;
  type: GameType;
  state: TState;
  currentTurn: UserId | null; // null once game is over, or n/a for simultaneous games
  playerIds: UserId[];
  status: 'active' | 'finished';
  winnerId: UserId | 'draw' | null;
  history: unknown[];
  createdAt: number;
  updatedAt: number;
  // Trivia only: Mutual Reveal meta, mirrored at the top level (rather than
  // nested in `state`) so firestore.rules can read `revealedAt` straight off
  // the session doc the same way it does for mood/journal entries.
  submittedBy?: Partial<Record<UserId, true>>;
  revealedAt?: number | null;
}

/** sparkPoints/{coupleId} — V2 seed */
export interface SparkPoints {
  coupleId: CoupleId;
  total: number;
  updatedAt: number;
}

export const SPARK_THRESHOLDS = [0, 25, 75, 150, 300, 500] as const;
