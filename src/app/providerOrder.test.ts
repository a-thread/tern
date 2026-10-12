import { assertProviderOrder } from './providerOrder';

describe('assertProviderOrder', () => {
  it('accepts providers listed after everything they need', () => {
    expect(() =>
      assertProviderOrder([
        { name: 'settings', needs: [] },
        { name: 'waypoints', needs: [] },
        { name: 'water', needs: ['settings', 'waypoints'] },
      ]),
    ).not.toThrow();
  });

  it('names the provider and the one it needs when the order is wrong', () => {
    expect(() =>
      assertProviderOrder([
        { name: 'water', needs: ['settings'] },
        { name: 'settings', needs: [] },
      ]),
    ).toThrow('water needs settings, which must be listed before it');
  });

  it('rejects a provider that needs one that is not listed at all', () => {
    expect(() => assertProviderOrder([{ name: 'mood', needs: ['settings'] }])).toThrow(/settings/);
  });
});
