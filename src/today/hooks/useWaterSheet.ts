import { useCallback, useState } from 'react';

import { createRequiredContext } from '@shared/state/createRequiredContext';

/** Opens Today's water sheet; the rows that open it read this instead of keeping a sheet each. */
type OpenWaterSheet = () => void;

const [WaterSheetContext, useOpenWaterSheet] =
  createRequiredContext<OpenWaterSheet>('useOpenWaterSheet', 'TodayScreen');
export { WaterSheetContext, useOpenWaterSheet };

/** `showing` holds until fully closed: opening a milestone over the modal left both stuck. */
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
