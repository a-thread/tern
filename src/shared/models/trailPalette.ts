import { colors } from '@shared/theme';
import { TrailColor } from '@/domain/settings/models/trailColor';

/** All light enough for Journey's dark sky. */
export const TRAIL_PALETTE: Record<TrailColor, string> = {
  [TrailColor.Arctic]: colors.route,
  [TrailColor.MidnightSun]: colors.sunLight,
  [TrailColor.Glacier]: colors.waterLight,
  [TrailColor.Twilight]: colors.violetTint,
};
