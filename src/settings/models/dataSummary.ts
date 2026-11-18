import { LogHome } from './logHome';

/** `home` is null for sample data, which isn't stored anywhere. */
export function dataSummary({
  home,
  canImport,
}: {
  home: LogHome | null;
  canImport: boolean;
}): string {
  const does = canImport ? 'export, restore or delete' : 'export or delete';
  if (home === null) return does[0].toUpperCase() + does.slice(1);
  return `${home === LogHome.Account ? 'Synced' : 'On this phone'} · ${does}`;
}
