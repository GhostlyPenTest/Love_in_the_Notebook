import { Defs, FeDisplacementMap, FeTurbulence, Filter } from 'react-native-svg';

/**
 * A real feTurbulence -> feDisplacementMap pencil-wobble filter, per the
 * brief. react-native-svg's filter defs are scoped to their own <Svg> tree
 * (no cross-<Svg> url(#id) references like on the web DOM), so every SVG
 * that wants the wobble includes its own copy of this with a unique id --
 * pass a stable id (e.g. from React's useId()) at the call site.
 *
 * CONFIRMED VIA ON-DEVICE TESTING: react-native-svg logs FeTurbulence and
 * FeDisplacementMap as "not yet supported on native platforms" -- this
 * renders as a silent no-op on Android/iOS today. components/doodles/
 * DoodleLayer.tsx doesn't use it for that reason (see the comment there for
 * what it uses instead); buttons/cards never did, using lib/paper/rough.ts's
 * seeded jittered paths, which do render everywhere. Kept here, unused, in
 * case a web target ever wants the real filter -- it does work in a browser.
 */
export function PencilWobbleFilter({
  id,
  seed = 1,
  scale = 2.2,
  baseFrequency = 0.045,
}: {
  id: string;
  seed?: number;
  scale?: number;
  baseFrequency?: number;
}) {
  return (
    <Defs>
      <Filter id={id} x="-25%" y="-25%" width="150%" height="150%">
        <FeTurbulence
          type="fractalNoise"
          baseFrequency={baseFrequency}
          numOctaves={2}
          seed={seed}
          result="pencilNoise"
        />
        <FeDisplacementMap
          in="SourceGraphic"
          in2="pencilNoise"
          scale={scale}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </Filter>
    </Defs>
  );
}
