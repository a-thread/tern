import { asError } from './utils/crashReport';

type Handler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsApi = {
  getGlobalHandler(): Handler;
  setGlobalHandler(handler: Handler): void;
};

let show: ((error: Error) => void) | null = null;
let installed = false;

/** The screen that shows a fatal error in place of closing the app; returns the unsubscribe. */
export function onFatalError(listener: (error: Error) => void): () => void {
  show = listener;
  return () => {
    if (show === listener) show = null;
  };
}

/**
 * Fatal errors outside render (a timer, a tap, a native callback) go to the crash screen instead
 * of killing the app. Dev keeps the red box, and with no screen mounted the default still runs.
 */
export function installFatalHandler(
  errorUtils: ErrorUtilsApi | undefined = (
    globalThis as { ErrorUtils?: ErrorUtilsApi }
  ).ErrorUtils,
  dev: boolean = __DEV__,
): void {
  if (installed || !errorUtils || dev) return;
  installed = true;
  const fallback = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    if (isFatal && show) show(asError(error));
    else fallback(error, isFatal);
  });
}

/** Tests only: forget the installed handler. */
export function resetFatalHandlerForTests(): void {
  installed = false;
  show = null;
}
