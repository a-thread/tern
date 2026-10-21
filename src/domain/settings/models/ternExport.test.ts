import { exportFileName, parseTernExport } from './ternExport';

const minimal = { exportedAt: '2026-10-20T08:00:00.000Z', weightUnit: 'lb' };

describe('parseTernExport', () => {
  it('reads an export, treating lists it lacks as empty', () => {
    const parsed = parseTernExport(
      JSON.stringify({ ...minimal, restDays: [{ day: '2026-10-18' }] }),
    );
    expect(parsed).toMatchObject({
      ok: true,
      copy: { restDays: [{ day: '2026-10-18' }], food: [], settings: null },
    });
  });

  it.each([
    ['text that is not JSON', 'not json'],
    ['a list', '[]'],
    ['an object with no export date', JSON.stringify({ weightUnit: 'lb' })],
    ['a list that is not a list', JSON.stringify({ ...minimal, food: {} })],
  ])('turns down %s', (_name, text) => {
    expect(parseTernExport(text)).toEqual({
      ok: false,
      message: "This file isn't a Tern export.",
    });
  });

  it('turns down weights in a unit it cannot read', () => {
    expect(
      parseTernExport(JSON.stringify({ ...minimal, weightUnit: 'kg' })),
    ).toMatchObject({ ok: false });
  });
});

describe('exportFileName', () => {
  it('is dated by the local day', () => {
    expect(exportFileName(new Date(2026, 0, 5, 23, 30))).toBe(
      'tern-export-2026-01-05.json',
    );
  });
});
