import { JourneyView } from '@/domain/settings/models/journeyView';
import { RouteId } from '@/domain/waypoints/models/routes';
import { JourneyMapShapes, type MapShape } from '../models/journeyMapShapes';

/** The views each route can be drawn in; the Dutch route has no globe. */
export class RouteShapes {
  // One constant, so a shape read from it is the same object every render.
  static readonly VIEWS: Record<
    RouteId,
    Partial<Record<JourneyView, MapShape>>
  > = {
    [RouteId.Greenland]: {
      [JourneyView.Map]: JourneyMapShapes.MAP,
      [JourneyView.Globe]: JourneyMapShapes.GLOBE,
    },
    [RouteId.Netherlands]: {
      [JourneyView.Map]: JourneyMapShapes.NETHERLANDS_MAP,
    },
  };
}

/** The views a route can be drawn in. */
export const routeViews = (route: RouteId) => RouteShapes.VIEWS[route];

/** The view to draw: the one chosen, when the route has it, else its flat map. */
export function routeView(route: RouteId, chosen: JourneyView): JourneyView {
  return RouteShapes.VIEWS[route][chosen] ? chosen : JourneyView.Map;
}
