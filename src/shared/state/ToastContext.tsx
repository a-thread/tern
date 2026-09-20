import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';

type ToastContextValue = { show: (message: string) => void };

// Without a provider (tests, isolated screens) showing a toast is a no-op.
const ToastContext = createContext<ToastContextValue>({ show: () => {} });

const VISIBLE_MS = 4000;

/** A small message at the bottom of the screen, e.g. when a background save fails. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((next: string) => {
    setMessage(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), VISIBLE_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <View style={s.wrap} pointerEvents='none'>
          <View style={s.toast} accessibilityLiveRegion='polite'>
            <Text style={s.text}>{message}</Text>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  toast: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: 10,
  },
  text: { fontFamily: font.medium, fontSize: 13, color: colors.paper },
});
