import { colors } from '@shared/theme';
import { TrailColor } from '@/domain/settings/models/trailColor';

/**
 * How each trail colour is drawn. All light enough to read on Journey's dark sky, and used by
 * both the map and the picker in Settings.
 */
export const TRAIL_PALETTE: Record<TrailColor, string> = {
  [TrailColor.Arctic]: colors.route,
  [TrailColor.MidnightSun]: colors.sunLight,
  [TrailColor.Glacier]: colors.waterLight,
  [TrailColor.Twilight]: colors.violetTint,
};
