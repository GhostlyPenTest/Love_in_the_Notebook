import { isValidWord } from './wordList';

export interface WordChainState {
  chain: { word: string; userId: string }[];
}

export function emptyChain(): WordChainState {
  return { chain: [] };
}

export function requiredStartLetter(state: WordChainState): string | null {
  if (state.chain.length === 0) return null;
  const last = state.chain[state.chain.length - 1].word;
  return last.slice(-1).toLowerCase();
}

export type WordChainError = 'invalid_word' | 'wrong_letter' | 'already_used' | null;

export function validateMove(state: WordChainState, rawWord: string): WordChainError {
  const word = rawWord.trim().toLowerCase();
  if (!isValidWord(word)) return 'invalid_word';
  const required = requiredStartLetter(state);
  if (required && !word.startsWith(required)) return 'wrong_letter';
  if (state.chain.some((c) => c.word.toLowerCase() === word)) return 'already_used';
  return null;
}
