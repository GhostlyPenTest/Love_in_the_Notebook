/**
 * All in-app copy. Voice: a note passed in high school, circa early 2000s.
 * AIM away-message energy — a little dramatic, a little cheesy on purpose.
 * Not modern slang, not corporate SaaS copy. Keep it here, not scattered in components,
 * so the whole app stays in one voice.
 */

export const appCopy = {
  tagline: 'the notebook we keep passing back n forth',
};

export const pairingCopy = {
  welcomeTitle: "ok so here's the deal",
  welcomeBody:
    "this notebook only works if it's the two of u. start a new one, or pass a code back n forth to join theirs.",
  createButton: 'start a new notebook',
  joinButton: 'i got a code already',
  yourCodeTitle: 'ur code is:',
  yourCodeBody: 'text this to them (not here lol, this app cant do that yet)',
  waitingForPartner: 'waiting for them to type it in...',
  enterCodePrompt: "what's the code they gave u?",
  codeInputPlaceholder: 'XXXXXX',
  joinButtonSubmit: "that's the one",
  invalidCode: "hm that code's not it. double check?",
  pairingSuccess: 'ur notebook is ready!! go write something',
  displayNamePrompt: 'what do we call u in here?',
  displayNamePlaceholder: 'ur name',
};

export const statusSignalsCopy = {
  screenTitle: 'status & signals',
  statusSectionTitle: "what's up rn",
  statusPromptEmpty: 'tap to say what ur doing',
  statusPlaceholder: 'ehh just vibing',
  statusUpdated: 'updated just now',
  statusPartnerLabel: (name: string) => `${name} rn:`,
  statusPartnerEmpty: "hasn't said anything yet",
  signalsSectionTitle: 'send a signal',
  signalsSubtitle: 'no typing required, just tap it',
  signalSentToast: "sent!! they'll know",
  signalLabels: {
    thinking: 'thinkin bout u',
    bad_day: 'today kinda sucked',
    miss_you: 'miss u!!',
    good_day: 'good day :)',
  },
  signalReceivedTitle: (name: string, label: string) => `${name} says: "${label}"`,
  signalsFeedTitle: 'signals u got',
  signalsFeedEmpty: 'nothing yet... send them one first maybe',
};

export const moodCopy = {
  screenTitle: 'mood weather',
  prompt: "how's ur vibe today?",
  subtitle: 'pick one. no overthinking it',
  icons: {
    sunny: 'sunny',
    foggy: 'foggy',
    stormy: 'stormy',
    calm: 'calm',
  },
  noteLabel: 'wanna add why? (optional)',
  notePlaceholder: 'no pressure but u can spill a lil',
  submitButton: "that's my vibe",
  editButton: 'change it',
  lockedTitle: 'locked in for today',
  lockedBody: "waiting on their side of the page...",
  revealTitle: 'both sides are in — flip the page',
  revealSubtitle: "here's how today went for both of u",
  alreadySubmittedToast: 'got it, saved!',
};

export const journalCopy = {
  screenTitle: 'the journal',
  prompt: 'spill it, how was today?',
  photoPrompt: 'add a pic (optional)',
  photoAddButton: 'add a pic',
  photoRemoveButton: 'remove pic',
  textPlaceholder: "today was... (go off, this is just for us)",
  submitButton: 'seal the page',
  lockedTitle: "page's sealed on ur end",
  lockedBody: "waiting on their side of the page...",
  revealTitle: 'both sides are in — flip the page',
  revealSubtitle: 'todays page, from both of u',
  emptyHistoryTitle: 'no pages yet',
  emptyHistoryBody: "todays the first one. make it count ig",
  historyTitle: 'old pages',
};

export const voiceNotesCopy = {
  screenTitle: 'dead-drop voice notes',
  subtitle: 'leave one whenever, listen whenever. no pressure to answer',
  recordButtonIdle: 'hold to record',
  recordingInProgress: 'recording... let go when ur done',
  recordingTooShort: "that was basically nothing, try again",
  sendButton: 'drop it in',
  sentToast: "dropped! they'll find it whenever",
  inboxTitle: 'the inbox',
  inboxEmpty: 'nothing here yet... drop the first one',
  unheardBadge: 'new',
  fromLabel: (name: string) => `from ${name}`,
  permissionDenied: "need mic access for this one, check ur settings?",
};

export const spark = {
  meterLabel: 'spark points',
  levelUpToast: (level: number) => `level up!! the spark hit stage ${level}`,
};

export const gamesCopy = {
  screenTitle: 'games',
  subtitle: 'pick ur poison',
  yourTurn: "yo it's ur move",
  waitingOnPartner: (name: string) => `waiting on ${name}...`,
  newGameButton: 'start a new one',
  gameOverWin: 'u won!! gg',
  gameOverLose: 'they got u this time. rematch?',
  gameOverDraw: "it's a draw. nobody's mad tho",
  rematchButton: 'run it back',
  list: {
    tic_tac_toe: { title: 'tic-tac-toe', blurb: 'the classic. zero stakes' },
    word_chain: { title: 'word chain', blurb: 'keep the chain alive' },
    trivia: { title: 'daily duel trivia', blurb: 'one question, once a day' },
    battleship: { title: 'battleship', blurb: 'sink their whole fleet' },
  },
};

export const ticTacToeCopy = {
  title: 'tic-tac-toe',
  yourMark: (mark: string) => `ur playing as ${mark}`,
};

export const wordChainCopy = {
  title: 'word chain',
  prompt: (letter: string) => `next word has to start with "${letter.toUpperCase()}"`,
  firstWordPrompt: 'u go first, any word works',
  inputPlaceholder: 'type ur word...',
  invalidWord: "that's not a real word (or we just don't know it, my bad)",
  invalidStartLetter: (letter: string) => `gotta start with "${letter.toUpperCase()}"`,
  alreadyUsed: 'already used that one, nice try',
  submitButton: 'send it',
  chainBrokenTitle: 'chain snapped',
  chainBrokenBody: (word: string) => `"${word}" broke the chain. rematch?`,
};

export const triviaCopy = {
  title: 'daily duel trivia',
  subtitle: "today's question — answer solo, reveal happens once ur both in",
  submitButton: 'lock it in',
  lockedTitle: "answer's locked in",
  lockedBody: 'waiting on their side of the page...',
  revealTitle: 'both answers are in — flip the page',
  correctBadge: 'correct!',
  incorrectBadge: 'nope',
  bothRightTitle: 'u BOTH got it. couple goals fr',
  bothWrongTitle: 'u BOTH whiffed it lol',
  comeBackTomorrow: "that's today's. new one tomorrow",
};

export const battleshipCopy = {
  title: 'battleship',
  placementPrompt: 'set up ur fleet',
  placementSubtitle: 'tap to place a ship, tap again to rotate',
  readyButton: "fleet's set",
  waitingForPartnerPlacement: "waiting on them to set up their fleet...",
  yourTurnPrompt: 'take ur shot',
  hit: 'HIT!',
  miss: 'miss...',
  sunk: (shipName: string) => `${shipName} is DOWN`,
  gameOverWin: 'u sank their whole fleet. gg',
  gameOverLose: 'ur fleet is toast. gg',
};

export const notificationsCopy = {
  newActivityTitle: 'omg new page — go check it',
  moodPromptTitle: "how's ur vibe today?",
  journalPromptTitle: 'spill it, how was today?',
  gameTurnTitle: "yo it's ur move",
  signalReceived: (label: string) => `they sent: "${label}"`,
  voiceNoteReceived: 'new voice note dropped for u',
  revealReady: 'both sides are in — flip the page',
};

export const commonCopy = {
  loading: 'flipping the page...',
  errorGeneric: 'ugh something broke. try again?',
  offline: "no signal rn, we'll sync when it's back",
  save: 'save',
  cancel: 'nvm',
  ok: 'k',
  back: 'back',
};
