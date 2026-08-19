/**
 * Central map of every Firestore path in the app. Nothing outside this file
 * (and lib/firebase/firestore.ts, which builds typed refs from it) should
 * hardcode a collection/document path string.
 *
 * One addition beyond the spec's data model: `pairingCodes/{code}`. It's a
 * lightweight lookup doc (code -> coupleId) so the "join with a code" flow
 * doesn't need broad read access to the `couples` collection. See
 * lib/firebase/auth.ts and firestore.rules.
 */
export const paths = {
  couple: (coupleId: string) => `couples/${coupleId}`,
  couples: () => `couples`,
  pairingCode: (code: string) => `pairingCodes/${code}`,

  user: (userId: string) => `users/${userId}`,

  moodEntry: (coupleId: string, date: string) => `moodEntries/${coupleId}/entries/${date}`,
  moodEntries: (coupleId: string) => `moodEntries/${coupleId}/entries`,

  journalEntry: (coupleId: string, date: string) => `journalEntries/${coupleId}/entries/${date}`,
  journalEntries: (coupleId: string) => `journalEntries/${coupleId}/entries`,

  voiceNotes: (coupleId: string) => `voiceNotes/${coupleId}/notes`,
  voiceNote: (coupleId: string, noteId: string) => `voiceNotes/${coupleId}/notes/${noteId}`,

  signals: (coupleId: string) => `signals/${coupleId}/sent`,
  signal: (coupleId: string, signalId: string) => `signals/${coupleId}/sent/${signalId}`,

  status: (userId: string) => `status/${userId}`,

  gameSessions: (coupleId: string) => `gameSessions/${coupleId}/sessions`,
  gameSession: (coupleId: string, sessionId: string) =>
    `gameSessions/${coupleId}/sessions/${sessionId}`,

  sparkPoints: (coupleId: string) => `sparkPoints/${coupleId}`,

  // Mutual Reveal submissions: a `submissions` subcollection under any meta doc
  // (moodEntry, journalEntry, or a trivia gameSession). Kept generic so
  // lib/reveal/useMutualReveal.ts works the same way for all of them --
  // see firestore.rules for the reveal-gated read rule on this subcollection.
  submissionsOf: (metaDocPath: string) => `${metaDocPath}/submissions`,
  submissionOf: (metaDocPath: string, userId: string) => `${metaDocPath}/submissions/${userId}`,
};
