import React from 'react';
import { Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';

import { RestScenes } from '@today/models/restScene';

const BODY = 'driftwoodBody';
const PAPER = '#FBFAF7';

// Drawn around the point the tern stands on, (155, 79): the top of the log runs level there.
const BASE = { x: 155, top: 79 };

/** The gradient the log's body is filled with. Goes in the scene's `<Defs>`. */
export function DriftwoodDefs() {
  return (
    <LinearGradient id={BODY} x1='0' y1='0' x2='0' y2='1'>
      <Stop offset='0' stopColor='#A08C76' />
      <Stop offset='0.35' stopColor='#7F6B55' />
      <Stop offset='1' stopColor='#4A392D' />
    </LinearGradient>
  );
}

/**
 * A weathered log lying in the shallows: a grey-brown body that darkens toward the water, a
 * lit top edge, grain, cracks and a knot, a cut end with its rings, a snapped branch at each
 * side, and a shadow and a few laps of water where it meets the surface. `lap` shifts the
 * little ripples around its base (a few units either way). `float` moves the whole log as it
 * drifts in and bobs: an offset in scene units and a rock in degrees about its middle.
 */
export function Driftwood({
  lap = 0,
  float = { dx: 0, dy: 0, tilt: 0 },
}: {
  lap?: number;
  float?: { dx: number; dy: number; tilt: number };
}) {
  const { x, top } = RestScenes.DRIFTWOOD;
  return (
    <G
      transform={`translate(${float.dx} ${float.dy}) rotate(${float.tilt} ${x} ${top + 5})`}
    >
      <G transform={`translate(${x - BASE.x} ${top - BASE.top})`}>
        {/* Its shadow on the water */}
        <Ellipse
          cx={156}
          cy={90.2}
          rx={38}
          ry={1.8}
          fill='#000'
          opacity={0.22}
        />

        {/* Snapped branches, behind the body */}
        <Path
          d='M173 80 C174.5 75, 178.5 72, 183.5 71 L186 72.8 C182.5 74.6, 180.6 77.4, 180.8 81 Z'
          fill='#6E5B47'
        />
        <Path d='M183.5 71 L186 72.8 L185 73.4 L182.8 71.9 Z' fill='#BBA78E' />
        <Path
          d='M133 79 C132 76.2, 129 74.6, 126.4 74.4 L125.8 76 C127.8 76.8, 129.2 77.8, 129.6 79.4 Z'
          fill='#6E5B47'
        />

        {/* The body */}
        <Path
          d='M120 84.6 C118.8 80.8, 123 77.4, 130 77.8 C140 78.7, 148 79, 156 79 C166 79, 176 78.4, 184 79.6 C188.4 80.4, 191.4 82.2, 190.2 84.8 C184 88.6, 172 89.8, 160 89.4 C146 90, 132 89.2, 124 87.6 C121.6 87, 120.4 86, 120 84.6 Z'
          fill={`url(#${BODY})`}
        />

        {/* Lit top edge, and the wet dark band at the waterline */}
        <Path
          d='M124 79.2 C132 78.2, 146 78.6, 156 78.5 C168 78.5, 178 78.1, 187 80'
          fill='none'
          stroke='#CDBEA5'
          strokeWidth={1.2}
          strokeLinecap='round'
          opacity={0.9}
        />
        {/* Bleached, silvery patches where the sun has dried the top of the wood */}
        <G fill='none' strokeLinecap='round' stroke='#D9CDB8'>
          <Path
            d='M128 80.4 C134 79.8, 140 80.2, 146 80'
            strokeWidth={0.9}
            opacity={0.4}
          />
          <Path
            d='M158 80.2 C165 79.8, 172 80.2, 179 80.6'
            strokeWidth={0.9}
            opacity={0.35}
          />
          <Path
            d='M150 81.4 C153 81.1, 156 81.4, 159 81.2'
            strokeWidth={0.7}
            opacity={0.3}
          />
        </G>
        <Path
          d='M124 87.4 C134 88.8, 146 89.2, 160 89 C172 89.4, 184 88.4, 189.6 85.4'
          fill='none'
          stroke='#1F1814'
          strokeWidth={1.6}
          strokeLinecap='round'
          opacity={0.6}
        />

        {/* Grain, running along the log, and a few cracks across it */}
        <G fill='none' strokeLinecap='round'>
          <Path
            d='M126 82 C138 80.8, 150 82, 164 81.2 S182 82.2, 187.4 82.8'
            stroke='#3B2F25'
            strokeWidth={0.6}
            opacity={0.65}
          />
          <Path
            d='M127 84.4 C140 83.4, 152 84.6, 166 83.8 S180 84.6, 186 85'
            stroke='#3B2F25'
            strokeWidth={0.55}
            opacity={0.6}
          />
          <Path
            d='M131 86.4 C142 85.8, 154 86.6, 168 86'
            stroke='#3B2F25'
            strokeWidth={0.5}
            opacity={0.5}
          />
          <Path
            d='M133 80.6 C142 80, 148 80.6, 156 80.2'
            stroke='#A58F76'
            strokeWidth={0.45}
            opacity={0.5}
          />
          <Path
            d='M165 80.6 C172 80.1, 178 80.6, 183 80.4'
            stroke='#A58F76'
            strokeWidth={0.45}
            opacity={0.45}
          />
          <Path
            d='M139 79.4 L138.4 83.6'
            stroke='#241B15'
            strokeWidth={0.5}
            opacity={0.6}
          />
          <Path
            d='M170.5 79.6 L171.2 84.4 L170.4 86.4'
            stroke='#241B15'
            strokeWidth={0.5}
            opacity={0.6}
          />
          <Path
            d='M181.5 80.6 L182 83.2'
            stroke='#241B15'
            strokeWidth={0.45}
            opacity={0.55}
          />
        </G>

        {/* A knot */}
        <Ellipse cx={147.5} cy={84.6} rx={2.5} ry={1.7} fill='#2A2019' />
        <Ellipse
          cx={147.5}
          cy={84.6}
          rx={3.6}
          ry={2.6}
          fill='none'
          stroke='#9A846C'
          strokeWidth={0.4}
          opacity={0.5}
        />

        {/* The cut end, with its rings */}
        <Ellipse cx={121.6} cy={83} rx={2.9} ry={4.7} fill='#B39C78' />
        <Ellipse
          cx={121.6}
          cy={83}
          rx={1.9}
          ry={3.3}
          fill='none'
          stroke='#7A6048'
          strokeWidth={0.45}
        />
        <Ellipse
          cx={121.6}
          cy={83}
          rx={0.9}
          ry={1.6}
          fill='none'
          stroke='#7A6048'
          strokeWidth={0.4}
        />

        {/* Laps of water where it meets the surface */}
        <G
          transform={`translate(${lap * 0.35} 0)`}
          fill='none'
          stroke={PAPER}
          strokeLinecap='round'
        >
          <Path
            d='M116 89.6 C120 91.2, 126 91.2, 130 90.2'
            strokeWidth={0.6}
            opacity={0.35}
          />
          <Path
            d='M178 90.4 C183 91.8, 189 91.6, 194 90'
            strokeWidth={0.6}
            opacity={0.3}
          />
          <Path
            d='M140 91.4 C150 92.4, 162 92.4, 172 91.4'
            strokeWidth={0.5}
            opacity={0.2}
          />
        </G>
      </G>
    </G>
  );
}
