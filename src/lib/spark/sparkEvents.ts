/**
 * V2 seed: every V1 action that "counts" bumps the shared spark counter by a
 * fixed amount. Kept as one small event -> points map so V2's real game
 * logic can hang additional behavior off the same event names later without
 * touching the call sites in each feature screen.
 */
export type SparkEventType =
  | 'signal_sent'
  | 'mood_entered'
  | 'journal_completed'
  | 'voice_note_left' // wired up once Voice Notes ships in V2
  | 'game_move';

export const SPARK_EVENT_POINTS: Record<SparkEventType, number> = {
  signal_sent: 2,
  mood_entered: 3,
  journal_completed: 5,
  voice_note_left: 2,
  game_move: 1,
};
