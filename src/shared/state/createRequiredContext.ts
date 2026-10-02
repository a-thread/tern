import { createContext, useContext } from 'react';

/**
 * A context that has no default: reading it outside its provider is a bug, so the hook
 * throws instead of returning null. Returns the context (for its `.Provider`) and the hook.
 */
export function createRequiredContext<T>(hookName: string, providerName: string) {
  const Context = createContext<T | null>(null);
  function useRequired(): T {
    const value = useContext(Context);
    if (value === null) throw new Error(`${hookName} must be used within ${providerName}`);
    return value;
  }
  return [Context, useRequired] as const;
}
