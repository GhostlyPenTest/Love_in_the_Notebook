import type { UserId } from '@/types/models';

/**
 * V1 scope note: a smaller fleet (3 ships, 6x6 board) than classic
 * Battleship, to keep the placement/battle UI manageable on a phone screen
 * within V1 -- still placement phase -> one guess per turn -> sink the fleet.
 *
 * Security note: there is no backend in this app, so hit/miss can't be
 * arbitrated by a trusted server. Instead each player's ship placement is
 * private (owner-only Firestore read, enforced by firestore.rules reusing
 * the Mutual Reveal `submissions` subcollection -- Battleship just never
 * sets `revealedAt`, so the partner-read branch of that rule never opens).
 * The DEFENDER's own client resolves incoming shots against their own
 * placement and writes back only the hit/miss/sunk result, never the
 * layout itself. That means a shot only resolves once the defender's app
 * is open to see it -- acceptable for a two-person async game, same as
 * every other turn-based feature here relying on a push nudge to reopen.
 */

export const BOARD_SIZE = 6;
export const SHIP_SIZES = [3, 2, 2];

export interface ShipPlacement {
  cells: [number, number][];
}

export interface BattleshipPlacement {
  ships: ShipPlacement[];
}

export interface ShotResult {
  x: number;
  y: number;
  hit: boolean;
  sunk: boolean;
}

export interface BattleshipState {
  boardSize: number;
  shipSizes: number[];
  ready: Partial<Record<UserId, true>>;
  pendingShot: { by: UserId; x: number; y: number } | null;
  /** Keyed by the SHOOTER's uid: every shot they've fired, with results. */
  shotsBy: Partial<Record<UserId, ShotResult[]>>;
  phase: 'placement' | 'battle';
  /**
   * Bumped on every rematch. Placement submission docs are immutable once
   * created (firestore.rules), so each round writes to its own
   * `{uid}-r{round}` submission doc instead of colliding with round 0's.
   */
  round: number;
}

export function emptyBattleshipState(round = 0): BattleshipState {
  return {
    boardSize: BOARD_SIZE,
    shipSizes: SHIP_SIZES,
    ready: {},
    pendingShot: null,
    shotsBy: {},
    phase: 'placement',
    round,
  };
}

function cellsFor(x: number, y: number, size: number, orientation: 'h' | 'v'): [number, number][] {
  return Array.from({ length: size }, (_, i) => (orientation === 'h' ? [x + i, y] : [x, y + i]) as [number, number]);
}

export function canPlaceShip(
  existing: ShipPlacement[],
  x: number,
  y: number,
  size: number,
  orientation: 'h' | 'v',
  boardSize = BOARD_SIZE
): [number, number][] | null {
  const cells = cellsFor(x, y, size, orientation);
  const inBounds = cells.every(([cx, cy]) => cx >= 0 && cx < boardSize && cy >= 0 && cy < boardSize);
  if (!inBounds) return null;
  const occupied = new Set(existing.flatMap((s) => s.cells.map(([cx, cy]) => `${cx},${cy}`)));
  const overlaps = cells.some(([cx, cy]) => occupied.has(`${cx},${cy}`));
  if (overlaps) return null;
  return cells;
}

export function isHit(ships: ShipPlacement[], x: number, y: number): boolean {
  return ships.some((s) => s.cells.some(([cx, cy]) => cx === x && cy === y));
}

export function isShipSunk(ship: ShipPlacement, hits: { x: number; y: number }[]): boolean {
  return ship.cells.every(([cx, cy]) => hits.some((h) => h.x === cx && h.y === cy));
}

export function allShipsSunk(ships: ShipPlacement[], hits: { x: number; y: number }[]): boolean {
  return ships.every((s) => isShipSunk(s, hits));
}
