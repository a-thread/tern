import React, { useMemo } from 'react';

import { createRequiredContext } from '@shared/state/createRequiredContext';
import type { DataRepository } from './dataRepository';
import type { TernExport } from './models/ternExport';

type DataContextValue = {
  /** Export and erase are offered: true for an account or the phone's database, false for in-memory sample data. */
  available: boolean;
  /** Restoring from an export is offered: the phone's database, or an account (through `import_my_data`). */
  canImport: boolean;
  /** A copy of everything Tern holds for the account. */
  exportAll: () => Promise<TernExport>;
  /** Erases everything stored for the account. The login is kept. */
  deleteAll: () => Promise<void>;
  /** Deletes the account itself, and everything stored for it. */
  deleteAccount: () => Promise<void>;
  /** Adds everything in an export, keeping what is already here; resolves to how many rows were added. */
  importAll: (copy: TernExport) => Promise<number>;
};

const [DataContext, useData] = createRequiredContext<DataContextValue>(
  'useData',
  'DataProvider',
);
export { useData };

const NOT_AVAILABLE = 'Account data is not available in local mode';

/** Whole-account export, erase and restore. `repo` is absent for in-memory sample data. */
export function DataProvider({
  repo,
  children,
}: {
  repo?: DataRepository;
  children: React.ReactNode;
}) {
  const value = useMemo<DataContextValue>(() => {
    const unavailable = () => Promise.reject(new Error(NOT_AVAILABLE));
    return {
      available: repo !== undefined,
      canImport: repo?.importAll !== undefined,
      exportAll: () => (repo ? repo.exportAll() : unavailable()),
      deleteAll: () => (repo ? repo.deleteAll() : unavailable()),
      deleteAccount: () => (repo ? repo.deleteAccount() : unavailable()),
      importAll: (copy) =>
        repo?.importAll ? repo.importAll(copy) : unavailable(),
    };
  }, [repo]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
