You are an expert Android app developer and senior UI/UX designer. Build the V1 of a two-person relationship app called **Love in the Notebook**.

## Project Overview
A shared Android app for two people (a couple), framed as one notebook passed back and forth. It exists to make emotional connection low-effort and externalized rather than dependent on remembering or having something to say — one partner has attention/memory that drops people from mind easily; the other is more talkative and wants consistent signals of presence. The whole app is one shared "notebook" both people write in.

## Tech Stack
- Expo (React Native), TypeScript
- Firebase: Firestore (data sync), Auth (two-user login), Cloud Messaging via Expo push notifications
- Build/ship via EAS (Expo Application Services) cloud builds — no local Android Studio dependency
- Hand-drawn SVG doodle assets, paper texture background, SVG turbulence/displacement filter for a pencil-wobble line effect

## Core Mechanic — build this first
A reusable **Mutual Reveal** component: user submits an entry → it's stored but hidden/locked from the other person → once both partners have submitted for that entry, both sides unlock and reveal simultaneously. This one component powers Mood Weather, the Journal, and three of the four games. Design it as a generic, reusable piece (typed props for content type, per-couple entry key, lock/reveal state) rather than rebuilding the logic per feature.

## V1 Features
1. **Mood Weather** — pick one icon (sunny/foggy/stormy/calm) for the day. Runs on Mutual Reveal.
2. **Dead-drop Voice Notes** — short voice clips, free-flowing inbox, NOT locked/mutual — no reciprocity requirement, just leave and listen whenever.
3. **Mutual Unlock Journal** — a photo + short text entry per day. Runs on Mutual Reveal.
4. **Signals** — a row of one-tap buttons (thinkin bout u / today kinda sucked / miss u!! / good day) that fire a push notification to the partner. No typing required.
5. **Status** — ambient "what I'm doing right now" field, tap-to-update, visible to the partner; ideally exposed as a home-screen widget too.
6. **Games** — all built on Mutual Reveal or simple turn-based state with push notification on opponent's turn:
   - Tic-Tac-Toe
   - Word Chain (each turn's word must start with the last letter of the previous word; validate against a basic dictionary word list)
   - Daily Duel Trivia (one question per day, both answer independently, Mutual Reveal shows both answers together)
   - Battleship (placement phase, then one guess per turn)

Build order for these: Tic-Tac-Toe → Word Chain → Daily Duel Trivia → Battleship (increasing complexity).

## Visual Theme — apply app-wide, not just to games
- No. 2 pencil / high-school-notebook aesthetic.
- Off-white paper background, faint blue ruled horizontal lines, a red vertical margin line.
- All line art and UI chrome should have a pencil-stroke wobble — not clean vector edges. Use SVG filters (feTurbulence / feDisplacementMap) to fake the hand-drawn look rather than needing real frame-by-frame art.
- Two doodle sets that visually "belong" to each partner: one set of hearts/flowers/stars/swirls, one set of a different, more masculine-coded theme (placeholder icon set is fine for V1 — use simple line-doodle stars/planes/arrows as a stand-in).
- A handful of these doodles should randomly fade in at low opacity in margins/background, drift slightly, then fade out and repeat with a new one — an ambient "someone's still doodling on this page" effect, not distracting from foreground content.
- Overall metaphor: every screen is a page in the same shared notebook.

## Voice & Tone — apply to all copy
All in-app text (notifications, button labels, prompts, empty states, loading states) should read like a note passed in high school circa the early 2000s — AIM away-message energy, a little dramatic, a little cheesy on purpose, casual slang of that era. Not modern slang, not corporate SaaS copy. Examples to match tone against:
- Tagline: "the notebook we keep passing back n forth"
- Signal labels: "thinkin bout u", "today kinda sucked", "miss u!!", "good day :)"
- New activity notification: "omg new page — go check it"
- Mood prompt: "how's ur vibe today?"
- Journal prompt: "spill it, how was today?"
- Game-turn notification: "yo it's ur move"
- Waiting/locked state: "waiting on her side of the page..."
- Reveal moment: "both sides are in — flip the page"

Generate additional copy in this same voice throughout — don't just reuse these examples verbatim everywhere.

## Data Model (Firestore)
- `couples/{coupleId}` — links the two user accounts
- `users/{userId}`
- `moodEntries/{coupleId}/{date}`
- `journalEntries/{coupleId}/{date}`
- `voiceNotes/{coupleId}/{noteId}`
- `signals/{coupleId}/{signalId}`
- `status/{userId}`
- `gameSessions/{coupleId}/{sessionId}` — generic shape: `type`, `state`, `currentTurn`, `history`
- `sparkPoints/{coupleId}` — running total, see V2 seed below

## V2 Seed — build the skeleton now, don't build the full feature
Do NOT build a full colony/settlement game in V1. Just lay the pipe it will run on later:
- A shared `sparkPoints` counter that increments whenever a V1 action completes (signal sent, mood entered, journal completed, voice note left, game move made).
- One small visual (a tiny plot with a sprite that changes at point thresholds) that reacts to this counter.
- Architecture should be: event → increment shared state → threshold check → render update, so V2 can extend this into full game logic without a rewrite.

## Screen Flow
Home ("the notebook," page-turn navigation) → tabbed/swipeable pages: Status & Signals · Mood Weather · Journal · Voice Notes · Games list → individual game screens.

## Build Instructions
1. Scaffold the Expo + TypeScript project and Firebase integration first.
2. Build the Mutual Reveal component as a standalone, reusable piece before wiring any feature to it.
3. Implement Signals and Status (simplest, no shared-state complexity).
4. Implement Mood Weather and Journal (both ride Mutual Reveal).
5. Implement Voice Notes.
6. Implement the games in the order listed above.
7. Implement the V2 seed (spark counter + minimal visual).
8. Apply the visual theme and voice/tone across all screens last, once functionality is in place — but keep the paper-background and pencil-line component styling in place from the start so screens don't need a late visual rewrite.

Ask me for clarification on anything ambiguous before making an architectural decision you're unsure about, rather than guessing silently.
