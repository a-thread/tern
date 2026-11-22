import { createContext, useContext } from 'react';

/** The hook throws outside its provider instead of returning null. */
export function createRequiredContext<T>(
  hookName: string,
  providerName: string,
) {
  const Context = createContext<T | null>(null);
  function useRequired(): T {
    const value = useContext(Context);
    if (value === null)
      throw new Error(`${hookName} must be used within ${providerName}`);
    return value;
  }
  return [Context, useRequired] as const;
}
