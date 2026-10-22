import { dataSummary } from './dataSummary';
import { LogHome } from './logHome';

describe('dataSummary', () => {
  it('says the data is synced, with a synced account', () => {
    expect(dataSummary({ home: LogHome.Account, canImport: true })).toBe(
      'Synced · export, restore or delete',
    );
  });

  it('says the data is on this phone otherwise', () => {
    expect(dataSummary({ home: LogHome.Phone, canImport: true })).toBe(
      'On this phone · export, restore or delete',
    );
  });

  it('just says what the page does for sample data', () => {
    expect(dataSummary({ home: null, canImport: false })).toBe('Export or delete');
  });
});
