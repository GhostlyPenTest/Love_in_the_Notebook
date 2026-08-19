import { useEffect, useId, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

import { paperColors } from '@/constants/theme';
import { hashSeed, mulberry32 } from '@/lib/paper/rough';
import { PencilWobbleFilter } from '@/components/paper/PencilFilters';

import { type DoodleSetName, doodleSets } from './doodleSets';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const spriteStyle = { position: 'absolute' as const };

interface SpriteSlot {
  /** Roughly which strip of the screen this sprite lives in, so doodles stay in margins. */
  region: 'left' | 'right';
  topFraction: number; // 0..1 down the page for this slot
}

function pickDoodle(rand: () => number, sets: DoodleSetName[]) {
  const setName = sets[Math.floor(rand() * sets.length)];
  const pool = doodleSets[setName];
  return { setName, doodle: pool[Math.floor(rand() * pool.length)] };
}

function DoodleSprite({ slot, sets, color }: { slot: SpriteSlot; sets: DoodleSetName[]; color: string }) {
  const { width } = useWindowDimensions();
  const reactId = useId();
  const rand = useMemo(() => mulberry32(hashSeed(reactId + slot.region)), [reactId, slot.region]);

  const [current, setCurrent] = useState(() => pickDoodle(rand, sets));
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const wobbleFilterId = `doodle-wobble-${reactId}`;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        const fadeInMs = 2600 + rand() * 1200;
        const holdMs = 3200 + rand() * 2600;
        const fadeOutMs = 2200 + rand() * 1000;
        const restMs = 1500 + rand() * 4000;
        const targetOpacity = 0.12 + rand() * 0.12;
        const drift = 6 + rand() * 10;

        if (cancelled) return;
        setCurrent(pickDoodle(rand, sets));
        // Mutating reanimated SharedValues via `.value =` is the sanctioned API, not a
        // React state mutation -- the react-compiler-oriented immutability lint rule can't
        // tell the difference, so it's disabled per-line rather than opting this whole
        // component out of the compiler.
        // eslint-disable-next-line react-hooks/immutability
        translateY.value = 0;
        // eslint-disable-next-line react-hooks/immutability
        opacity.value = withTiming(targetOpacity, { duration: fadeInMs, easing: Easing.out(Easing.quad) });
        translateY.value = withTiming(-drift, { duration: fadeInMs + holdMs, easing: Easing.inOut(Easing.quad) });

        await sleep(fadeInMs + holdMs);
        if (cancelled) return;
        opacity.value = withTiming(0, { duration: fadeOutMs, easing: Easing.in(Easing.quad) });

        await sleep(fadeOutMs + restMs);
      }
    }

    loop();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const size = 46;
  const left = slot.region === 'left' ? 6 : width - size - 6;
  const top = slot.topFraction * 1400; // tall scroll area is fine; content sits above this layer

  return (
    <Animated.View
      pointerEvents="none"
      style={[spriteStyle, { left, top, width: size, height: size }, animatedStyle]}
    >
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <PencilWobbleFilter id={wobbleFilterId} seed={hashSeed(current.doodle.d.slice(0, 8))} scale={1.6} />
        <Path
          d={current.doodle.d}
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={`url(#${wobbleFilterId})`}
        />
      </Svg>
    </Animated.View>
  );
}

/**
 * Ambient "someone's still doodling on this page" effect: a handful of
 * doodles fade in at low opacity in the margins, drift slightly, fade out,
 * and repeat with a new one. Mixes both partners' doodle sets by default --
 * it's one shared notebook, not a per-user layer.
 */
export function DoodleLayer({
  sets = ['floral', 'arrows'],
  count = 4,
}: {
  sets?: DoodleSetName[];
  count?: number;
}) {
  const slots = useMemo<SpriteSlot[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        region: i % 2 === 0 ? 'left' : 'right',
        topFraction: (i + 0.5) / count,
      })),
    [count]
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {slots.map((slot, i) => (
        <DoodleSprite
          key={i}
          slot={slot}
          sets={sets}
          color={slot.region === 'left' ? paperColors.inkPink : paperColors.inkBlue}
        />
      ))}
    </View>
  );
}
