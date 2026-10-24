import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import { colors, font, radius, space } from '../theme';

/** A button on the toast, e.g. "Undo" after removing something. */
export type ToastAction = { label: string; onPress: () => void };

type ToastContextValue = {
  show: (message: string, action?: ToastAction) => void;
};

// Without a provider (tests, isolated screens) showing a toast is a no-op.
const ToastContext = createContext<ToastContextValue>({ show: () => {} });

const VISIBLE_MS = 4000;
/** A toast with a button stays a little longer, so there is time to reach it. */
const VISIBLE_WITH_ACTION_MS = 6000;

/** A small message at the bottom of the screen, e.g. when a background save fails. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    action?: ToastAction;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((message: string, action?: ToastAction) => {
    setToast({ message, action });
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setToast(null),
      action ? VISIBLE_WITH_ACTION_MS : VISIBLE_MS,
    );
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View style={s.wrap} pointerEvents='box-none'>
          <View style={s.toast} accessibilityLiveRegion='polite'>
            <Text style={s.text}>{toast.message}</Text>
            {toast.action ? (
              <Pressable
                onPress={() => {
                  toast.action?.onPress();
                  hide();
                }}
                hitSlop={8}
                accessibilityRole='button'
                accessibilityLabel={toast.action.label}
              >
                <Text style={s.action}>{toast.action.label}</Text>
              </Pressable>
            ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: 10,
  },
  text: { fontFamily: font.medium, fontSize: 13, color: colors.paper },
  action: { fontFamily: font.semibold, fontSize: 13, color: colors.sun },
});
