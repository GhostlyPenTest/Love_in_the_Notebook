import { increment, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { paths } from '@/constants/firestorePaths';
import { docRef } from '@/lib/firebase/firestore';
import type { CoupleId, SparkPoints } from '@/types/models';
import { SPARK_THRESHOLDS } from '@/types/models';

import { SPARK_EVENT_POINTS, type SparkEventType } from './sparkEvents';

/**
 * V2 seed architecture: event -> increment shared state -> threshold check
 * -> render update. V2 extends this into real game logic without touching
 * this pipe -- it just reads `total`/`level` the same way this hook does.
 */

/** Fire-and-forget increment; call after any V1 action that should feed the spark counter. */
export async function recordSparkEvent(coupleId: CoupleId, event: SparkEventType): Promise<void> {
  const points = SPARK_EVENT_POINTS[event];
  await setDoc(
    docRef<SparkPoints>(paths.sparkPoints(coupleId)),
    {
      coupleId,
      total: increment(points) as unknown as number,
      updatedAt: serverTimestamp() as unknown as number,
    },
    { merge: true }
  ).catch((err) => console.warn('[spark] failed to record event', event, err));
}

export function levelForTotal(total: number): number {
  let level = 0;
  for (let i = 0; i < SPARK_THRESHOLDS.length; i++) {
    if (total >= SPARK_THRESHOLDS[i]) level = i;
  }
  return level;
}

export function useSparkPoints(coupleId: CoupleId | null) {
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) return;
    const unsub = onSnapshot(docRef<SparkPoints>(paths.sparkPoints(coupleId)), (snap) => {
      setTotal(snap.exists() ? snap.data().total : 0);
      setLoading(false);
    });
    return unsub;
  }, [coupleId]);

  const level = useMemo(() => levelForTotal(total), [total]);
  const nextThreshold = SPARK_THRESHOLDS[level + 1] ?? null;

  return { total, level, nextThreshold, loading };
}
