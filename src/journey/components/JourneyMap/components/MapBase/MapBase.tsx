import React from 'react';
import { Path } from 'react-native-svg';

import { colors } from '@shared/theme';
import { type MapShape } from '../../models/journeyMapShapes';

/**
 * The parts of the map that don't move while the tern flies: the sea (on the globe), the grid,
 * the land, and the route underneath the flown line. Memoised, so the tern's flight, which
 * re-renders the map about 30 times a second, doesn't redraw the large coastline path each time.
 * `k` is the zoom, which lines are drawn that much thinner for so they keep their size.
 */
export const MapBase = React.memo(function MapBase({
  shape,
  path,
  lap,
  k,
}: {
  shape: MapShape;
  /** The whole route, as an SVG path. */
  path: string;
  /** Which migration this is: a finished one stays underneath; the first shows the way dashed. */
  lap: number;
  k: number;
}) {
  return (
    <>
      {shape.sphere ? (
        <Path
          d={shape.sphere}
          fill={colors.mapSea}
          stroke={colors.mapGrid}
          strokeWidth={1 / k}
        />
      ) : null}
      <Path
        d={shape.graticule}
        fill='none'
        stroke={colors.mapGrid}
        strokeWidth={0.6 / k}
      />
      <Path d={shape.land} fill={colors.mapLand} />
      {lap > 1 ? (
        <Path
          d={path}
          fill='none'
          stroke={colors.routePast}
          strokeWidth={1.6 / k}
        />
      ) : (
        <Path
          d={path}
          fill='none'
          stroke={colors.routeAhead}
          strokeWidth={1.2 / k}
          strokeDasharray={`${3 / k} ${4 / k}`}
        />
      )}
    </>
  );
});
