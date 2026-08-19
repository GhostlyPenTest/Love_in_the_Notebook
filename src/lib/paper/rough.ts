/**
 * Seeded "hand-drawn" path helpers. Two techniques combine to fake pencil
 * wobble reliably on both platforms:
 *  1. Here: perimeter points get a small seeded jitter, then get threaded
 *     into a smooth path (works identically on iOS/Android/web, no SVG
 *     filter support required).
 *  2. components/paper/PencilFilters.tsx: a real feTurbulence/feDisplacementMap
 *     filter, layered on top for doodle line art specifically, per the brief.
 * Seeded (not Math.random) so a given card/button doesn't re-jitter every render.
 */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Point {
  x: number;
  y: number;
}

/** Smooth, slightly-imperfect path through points via quadratic midpoint curves. */
function smoothPathThroughPoints(points: Point[], closed: boolean): string {
  if (points.length < 2) return '';
  const pts = closed ? [...points, points[0], points[1]] : points;
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} `;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const mid = { x: (curr.x + next.x) / 2, y: (curr.y + next.y) / 2 };
    d += `Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${mid.x.toFixed(2)} ${mid.y.toFixed(2)} `;
  }
  if (closed) d += 'Z';
  return d;
}

/**
 * A rounded-rect outline that reads as pencil-drawn instead of vector-clean:
 * walks the perimeter, nudges each sample point along its outward normal by
 * a small seeded random amount, then smooths a path through them.
 */
export function roughRoundedRectPath(
  width: number,
  height: number,
  radius: number,
  seed: number,
  jitter = 1.6,
  pointsPerEdge = 6
): string {
  const rand = mulberry32(seed);
  const r = Math.min(radius, width / 2, height / 2);
  const points: Point[] = [];

  const pushEdge = (from: Point, to: Point, normal: Point) => {
    for (let i = 0; i < pointsPerEdge; i++) {
      const t = i / pointsPerEdge;
      const j = (rand() - 0.5) * 2 * jitter;
      points.push({
        x: from.x + (to.x - from.x) * t + normal.x * j,
        y: from.y + (to.y - from.y) * t + normal.y * j,
      });
    }
  };

  // Corners are approximated with a couple of jittered points rather than
  // true arcs -- at pencil scale the difference is invisible and it keeps
  // this one continuous point walk instead of mixed arc/line segments.
  pushEdge({ x: r, y: 0 }, { x: width - r, y: 0 }, { x: 0, y: -1 });
  pushEdge({ x: width, y: r }, { x: width, y: height - r }, { x: 1, y: 0 });
  pushEdge({ x: width - r, y: height }, { x: r, y: height }, { x: 0, y: 1 });
  pushEdge({ x: 0, y: height - r }, { x: 0, y: r }, { x: -1, y: 0 });

  return smoothPathThroughPoints(points, true);
}

/** A single hand-drawn horizontal-ish squiggle divider (e.g. under a header). */
export function roughUnderlinePath(width: number, seed: number, waviness = 3): string {
  const rand = mulberry32(seed);
  const segments = 8;
  const points: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const x = (width * i) / segments;
    const y = (rand() - 0.5) * 2 * waviness;
    points.push({ x, y });
  }
  return smoothPathThroughPoints(points, false);
}
