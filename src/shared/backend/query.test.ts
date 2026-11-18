import { allRows } from './query';

/** A fake table of `total` numbered rows, served the way `.range(from, to)` serves them. */
function table(total: number) {
  const calls: [number, number][] = [];
  const page = (from: number, to: number) => {
    calls.push([from, to]);
    const data = Array.from(
      { length: Math.max(0, Math.min(to, total - 1) - from + 1) },
      (_, i) => from + i,
    );
    return Promise.resolve({ data, error: null });
  };
  return { page, calls };
}

describe('allRows', () => {
  it('reads past the first page until a short one comes back', async () => {
    const { page, calls } = table(25);
    const found = await allRows<number>(page, 10);
    expect(found).toEqual(Array.from({ length: 25 }, (_, i) => i));
    expect(calls).toEqual([
      [0, 9],
      [10, 19],
      [20, 29],
    ]);
  });

  it('asks once more when the rows fill the last page exactly', async () => {
    const { page, calls } = table(20);
    expect(await allRows<number>(page, 10)).toHaveLength(20);
    expect(calls).toHaveLength(3);
  });

  it('gives [] for no rows, in one request', async () => {
    const { page, calls } = table(0);
    expect(await allRows<number>(page, 10)).toEqual([]);
    expect(calls).toHaveLength(1);
  });

  it('throws when a page fails', async () => {
    const failure = new Error('boom');
    await expect(
      allRows(() => Promise.resolve({ data: null, error: failure })),
    ).rejects.toBe(failure);
  });
});
