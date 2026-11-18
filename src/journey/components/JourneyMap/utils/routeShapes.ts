import { JourneyView } from '@/domain/settings/models/journeyView';
import { RouteId } from '@/domain/waypoints/models/routes';
import { JourneyMapShapes, type MapShape } from '../models/journeyMapShapes';

/**
 * The views a route can be drawn in. Greenland's has a flat map and a globe; the Dutch route
 * reaches the far side of the world, so it has only a flat map.
 */
export function routeViews(
  route: RouteId,
): Partial<Record<JourneyView, MapShape>> {
  switch (route) {
    case RouteId.Netherlands:
      return { [JourneyView.Map]: JourneyMapShapes.NETHERLANDS_MAP };
    case RouteId.Greenland:
      return {
        [JourneyView.Map]: JourneyMapShapes.MAP,
        [JourneyView.Globe]: JourneyMapShapes.GLOBE,
      };
  }
}

/** The view to draw: the one chosen, when the route has it, else its flat map. */
export function routeView(route: RouteId, chosen: JourneyView): JourneyView {
  return routeViews(route)[chosen] ? chosen : JourneyView.Map;
}
