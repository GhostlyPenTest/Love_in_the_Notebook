/**
 * Two placeholder doodle sets that visually "belong" to each partner (per the
 * brief, simple line-doodle stand-ins are fine for V1 -- swap for real
 * hand-drawn art later without touching anything that consumes this file).
 * All paths are stroke-only, drawn in a 32x32 box, deliberately loose/uneven
 * so they read as doodled rather than iconography.
 */

export type DoodleSetName = 'floral' | 'arrows';

export interface DoodlePath {
  d: string;
  viewBox?: string;
}

export const doodleSets: Record<DoodleSetName, DoodlePath[]> = {
  floral: [
    // heart
    { d: 'M16 27 C 4 19, 3 10, 10 7 C 14 5, 16 9, 16 11 C 16 9, 18 5, 22 7 C 29 10, 28 19, 16 27 Z' },
    // 5-petal flower
    {
      d: 'M16 16 C 14 11, 10 10, 8 13 C 6 16, 9 19, 13 17 C 10 20, 11 24, 15 24 C 18 24, 18 20, 16 17 C 19 19, 23 18, 22 14 C 21 11, 17 12, 16 16 Z',
    },
    // little star
    { d: 'M16 5 L 18.5 13 L 27 14 L 20 19 L 22.5 27 L 16 22 L 9.5 27 L 12 19 L 5 14 L 13.5 13 Z' },
    // swirl
    { d: 'M23 9 C 27 12, 26 19, 20 20 C 15 21, 12 17, 15 14 C 17 12, 20 14, 19 17' },
  ],
  arrows: [
    // star (shared shape, different set can still lean on it)
    { d: 'M16 5 L 18.5 13 L 27 14 L 20 19 L 22.5 27 L 16 22 L 9.5 27 L 12 19 L 5 14 L 13.5 13 Z' },
    // paper airplane
    { d: 'M5 17 L 27 6 L 19 28 L 15 18 L 5 17 Z M 15 18 L 27 6' },
    // arrow
    { d: 'M6 22 C 14 12, 20 10, 27 8 M 20 6 L 27 8 L 24 15' },
    // lightning bolt
    { d: 'M18 4 L 8 18 L 15 18 L 13 28 L 25 13 L 17 13 Z' },
  ],
};
