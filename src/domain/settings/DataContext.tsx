import React, { useMemo } from 'react';

import { createRequiredContext } from '@shared/state/createRequiredContext';
import type { DataRepository, TernExport } from './dataRepository';

type DataContextValue = {
  /** Export and erase are offered: true for an account or the phone's database, false for in-memory sample data. */
  available: boolean;
  /** A copy of everything Tern holds for the account. */
  exportAll: () => Promise<TernExport>;
  /** Erases everything stored for the account. The login is kept. */
  deleteAll: () => Promise<void>;
  /** Deletes the account itself, and everything stored for it. */
  deleteAccount: () => Promise<void>;
};

const [DataContext, useData] = createRequiredContext<DataContextValue>(
  'useData',
  'DataProvider',
);
export { useData };

const NOT_AVAILABLE = 'Account data is not available in local mode';

/** Whole-account export and erase. `repo` is absent in local mode. */
export function DataProvider({
  repo,
  children,
}: {
  repo?: DataRepository;
  children: React.ReactNode;
}) {
  const value = useMemo<DataContextValue>(
    () => ({
      available: repo !== undefined,
      exportAll: () =>
        repo ? repo.exportAll() : Promise.reject(new Error(NOT_AVAILABLE)),
      deleteAll: () =>
        repo ? repo.deleteAll() : Promise.reject(new Error(NOT_AVAILABLE)),
      deleteAccount: () =>
        repo ? repo.deleteAccount() : Promise.reject(new Error(NOT_AVAILABLE)),
    }),
    [repo],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
