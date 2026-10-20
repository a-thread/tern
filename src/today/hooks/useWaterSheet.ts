import { useCallback, useState } from 'react';

import { createRequiredContext } from '@shared/state/createRequiredContext';

/** Opens Today's water sheet; the rows that open it read this instead of keeping a sheet each. */
type OpenWaterSheet = () => void;

const [WaterSheetContext, useOpenWaterSheet] =
  createRequiredContext<OpenWaterSheet>('useOpenWaterSheet', 'TodayScreen');
export { WaterSheetContext, useOpenWaterSheet };

/**
 * The one water sheet on Today. `showing` stays true until the sheet has finished closing,
 * so a waypoint burst or a milestone (a screen of its own) waits for it: opening one over
 * the sheet's modal left both stuck on screen.
 */
export function useWaterSheet() {
  const [visible, setVisible] = useState(false);
  const [showing, setShowing] = useState(false);

  const open = useCallback(() => {
    setVisible(true);
    setShowing(true);
  }, []);
  const close = useCallback(() => setVisible(false), []);
  const hidden = useCallback(() => setShowing(false), []);

  return { visible, showing, open, close, hidden };
}
