import { useState } from 'react';

/** A second tap clears it; a redraw that moves the piece drops the selection. */
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
