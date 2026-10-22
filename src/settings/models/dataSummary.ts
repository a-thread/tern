import { LogHome } from './logHome';

/**
 * The "Your data" line on the Settings index: where the data is, then what the page does.
 * `home` is null for sample data, which isn't stored anywhere and can only be looked at.
 */
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
