import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { FoodApiError } from '@/domain/food/sources/http';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { getProductByBarcode } from '../../sources/openFoodFacts';
import { ScanPhaseKind, type ScanPhase } from '../models/scanPhase';

/**
 * Looks barcodes up on Open Food Facts, one at a time (the camera fires repeatedly while a code is
 * in view). A product with nutrition goes to `onFound`; anything else leaves a phase saying why.
 * Coming back to the screen starts a fresh scan.
 */
export function useBarcodeLookup(onFound: (result: SearchResult) => void) {
  const [phase, setPhase] = useState<ScanPhase>({
    kind: ScanPhaseKind.Scanning,
  });
  const busy = useRef(false);

  const scanAgain = useCallback(() => {
    busy.current = false;
    setPhase({ kind: ScanPhaseKind.Scanning });
  }, []);

  // Coming back from the details screen (or first arriving) starts a fresh scan.
  useFocusEffect(scanAgain);

  const lookup = async (raw: string) => {
    if (busy.current) return;
    busy.current = true;
    setPhase({ kind: ScanPhaseKind.Looking });
    try {
      const res = await getProductByBarcode(raw);
      if (res.status === 'found') {
        // Stay on "looking" until this screen regains focus (see above).
        onFound(res.result);
        return;
      }
      setPhase({
        kind: ScanPhaseKind.Miss,
        name: res.status === 'no-nutrition' ? res.name : undefined,
      });
    } catch (e) {
      console.warn(
        'Barcode lookup failed',
        e instanceof FoodApiError ? e.kind : e,
      );
      setPhase({ kind: ScanPhaseKind.Error });
    }
  };

  return { phase, lookup, scanAgain };
}
