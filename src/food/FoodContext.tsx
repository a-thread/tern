import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { foodLog as initialFoodLog } from './mock';
import type { FoodEntry } from './models';

type NewFoodEntry = Omit<FoodEntry, 'id'>;

type FoodContextValue = {
  foodLog: FoodEntry[];
  addFoodEntry: (entry: NewFoodEntry) => void;
  updateFoodEntry: (id: string, patch: Partial<NewFoodEntry>) => void;
  removeFoodEntry: (id: string) => void;
};

const FoodContext = createContext<FoodContextValue | null>(null);

export function FoodProvider({ children }: { children: React.ReactNode }) {
  const [foodLog, setFoodLog] = useState<FoodEntry[]>(initialFoodLog);

  const addFoodEntry = useCallback((entry: NewFoodEntry) => {
    setFoodLog((prev) => [...prev, { ...entry, id: `f${Date.now()}` }]);
  }, []);

  const updateFoodEntry = useCallback(
    (id: string, patch: Partial<NewFoodEntry>) => {
      setFoodLog((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      );
    },
    [],
  );

  const removeFoodEntry = useCallback((id: string) => {
    setFoodLog((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const value = useMemo<FoodContextValue>(
    () => ({ foodLog, addFoodEntry, updateFoodEntry, removeFoodEntry }),
    [foodLog, addFoodEntry, updateFoodEntry, removeFoodEntry],
  );

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}

export function useFood() {
  const ctx = useContext(FoodContext);
  if (!ctx) throw new Error('useFood must be used within FoodProvider');
  return ctx;
}
