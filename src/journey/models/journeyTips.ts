import { Tip } from '@/domain/settings/models/onboarding';

/** What each tip on Journey says: a bold opening, then the rest. */
export function journeyTipText(tip: Tip): { lead: string; rest: string } {
  switch (tip) {
    case Tip.MapZoom:
      return {
        lead: 'See the whole route.',
        rest: 'Tap here, or double-tap the map, to zoom out. Do it again to come back to your tern.',
      };
    case Tip.MapView:
      return {
        lead: 'Flat map or globe.',
        rest: 'Switch how the Atlantic is drawn. Tern remembers which you pick.',
      };
    default:
      return {
        lead: 'Tap a stop to see where it is.',
        rest: 'Its name shows on the map. Pinch to zoom in, and drag to look around.',
      };
  }
}
