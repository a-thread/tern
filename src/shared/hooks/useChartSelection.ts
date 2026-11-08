import { useState } from 'react';

/**
 * Which piece of a chart was tapped. `keys` name each piece (its date); a tap on a piece
 * selects it, a second tap clears it. When the chart redraws with other data (a new range),
 * a selection whose piece is no longer where it was is dropped rather than moved to another one.
 */
export function useChartSelection(keys: readonly string[]) {
  const [picked, setPicked] = useState<{ index: number; key: string } | null>(
    null,
  );
  const selected =
    picked !== null && keys[picked.index] === picked.key ? picked.index : null;
  const toggle = (index: number) =>
    setPicked(selected === index ? null : { index, key: keys[index] });
  return { selected, toggle };
}
