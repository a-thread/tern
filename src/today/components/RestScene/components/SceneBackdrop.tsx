import React from 'react';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { radius } from '@shared/theme';
import { RestScenes, type ScenePose } from '@/today/models/restScene';
import { Driftwood, DriftwoodDefs } from './Driftwood/Driftwood';
import { SceneCanvas } from '../models/sceneCanvas';

const { WIDTH, HEIGHT } = SceneCanvas;

/**
 * Everything in the scene but the tern, drawn for one pose: the sky and its stars, the sun and
 * its glow, the water with the sun's shimmer and the ripples, and the driftwood. Fills its box.
 */
export function SceneBackdrop({ pose }: { pose: ScenePose }) {
  const sunY = RestScenes.SUN_DAY_Y + pose.sunDrop;

  return (
    <Svg width='100%' height='100%' viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <Defs>
        <ClipPath id='canvasClip'>
          <Rect x={0} y={0} width={WIDTH} height={HEIGHT} rx={radius.md} />
        </ClipPath>
        <LinearGradient id='restSky' x1='0' y1='0' x2='0' y2='1'>
          <Stop offset='0' stopColor={pose.sky.top} />
          <Stop offset='1' stopColor={pose.sky.horizon} />
        </LinearGradient>
        <LinearGradient id='restWater' x1='0' y1='0' x2='0' y2='1'>
          <Stop offset='0' stopColor={pose.water.top} />
          <Stop offset='1' stopColor={pose.water.bottom} />
        </LinearGradient>
        <DriftwoodDefs />
      </Defs>

      <G clipPath='url(#canvasClip)'>
        <Rect
          x={0}
          y={0}
          width={WIDTH}
          height={RestScenes.HORIZON}
          fill='url(#restSky)'
        />
        {SceneCanvas.STARS.map((star, i) => (
          <Circle
            key={`star-${i}`}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill={SceneCanvas.PAPER}
            opacity={pose.starOpacity * (pose.twinkle[i] ?? 1)}
          />
        ))}

        <Circle
          cx={SceneCanvas.SUN_X}
          cy={sunY}
          r={SceneCanvas.HALO_RADIUS * pose.haloScale}
          fill={RestScenes.SUN.glow}
          opacity={pose.haloOpacity * 0.4}
        />
        <Circle
          cx={SceneCanvas.SUN_X}
          cy={sunY}
          r={RestScenes.SUN_RADIUS}
          fill={RestScenes.SUN.disc}
          opacity={0.9}
        />

        <Rect
          x={0}
          y={RestScenes.HORIZON}
          width={WIDTH}
          height={HEIGHT - RestScenes.HORIZON}
          fill='url(#restWater)'
        />
        {SceneCanvas.SHIMMER.map((line, i) => (
          <WaterLine
            key={`shimmer-${i}`}
            line={line}
            drift={pose.shimmer[i] ?? 0}
            color={RestScenes.SUN.disc}
            width={1}
            opacity={0.35}
          />
        ))}
        {SceneCanvas.RIPPLES.map((line, i) => (
          <WaterLine
            key={`ripple-${i}`}
            line={line}
            drift={pose.ripple[i] ?? 0}
            color={SceneCanvas.PAPER}
            width={0.8}
            opacity={0.15}
          />
        ))}

        <Driftwood lap={pose.ripple[1] ?? 0} float={pose.driftwood} />
      </G>
    </Svg>
  );
}

/** A level line of light on the water, drifted sideways by `drift`. */
function WaterLine({
  line,
  drift,
  color,
  width,
  opacity,
}: {
  line: { x1: number; x2: number; y: number };
  drift: number;
  color: string;
  width: number;
  opacity: number;
}) {
  return (
    <Line
      x1={line.x1 + drift}
      y1={line.y}
      x2={line.x2 + drift}
      y2={line.y}
      stroke={color}
      strokeWidth={width}
      opacity={opacity}
    />
  );
}
