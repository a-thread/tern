import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { WaterSplash } from './components/WaterSplash';

type Splash = { id: number; x: number; y: number; big: boolean };
type WaterSplashApi = {
  /** Splashes water around `from` (the button that logged the drink); `big` for the goal drink. */
  splash: (from: View | null, big: boolean) => void;
};

// Optional on purpose: outside a layer a drink still buzzes, it just doesn't splash.
const WaterSplashContext = createContext<WaterSplashApi | null>(null);

/** The nearest splash layer, or null when there is none. */
export function useWaterSplash() {
  return useContext(WaterSplashContext);
}

/**
 * A view whose children can splash water around a button. The splash is drawn on top of
 * everything inside it, so it isn't clipped by the card or list the button sits in. Put it
 * around a whole screen's content (or a sheet's, since a Modal draws above the screen).
 */
export function WaterSplashLayer({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const layerRef = useRef<View>(null);
  const nextId = useRef(0);
  const [splashes, setSplashes] = useState<Splash[]>([]);

  const splash = useCallback((from: View | null, big: boolean) => {
    const layer = layerRef.current;
    if (!from || !layer) return;
    layer.measureInWindow((lx, ly) =>
      from.measureInWindow((x, y, w, h) => {
        const id = ++nextId.current;
        setSplashes((prev) => [
          ...prev,
          { id, x: x - lx + w / 2, y: y - ly + h / 2, big },
        ]);
      }),
    );
  }, []);

  const remove = useCallback(
    (id: number) => setSplashes((prev) => prev.filter((s) => s.id !== id)),
    [],
  );
  const api = useMemo(() => ({ splash }), [splash]);

  return (
    <WaterSplashContext.Provider value={api}>
      <View ref={layerRef} collapsable={false} style={style}>
        {children}
        <View style={StyleSheet.absoluteFill} pointerEvents='none'>
          {splashes.map((s) => (
            <WaterSplash
              key={s.id}
              x={s.x}
              y={s.y}
              big={s.big}
              onDone={() => remove(s.id)}
            />
          ))}
        </View>
      </View>
    </WaterSplashContext.Provider>
  );
}
