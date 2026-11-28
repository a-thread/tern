import { addSteps } from './addSteps';

describe('addSteps', () => {
  it('adds hand-logged steps to the health app’s, day by day', () => {
    expect(
      addSteps(
        { '2026-11-26': 3000 },
        { '2026-11-26': 600, '2026-11-27': 200 },
      ),
    ).toEqual({ '2026-11-26': 3600, '2026-11-27': 200 });
  });

  it('keeps the same map when there is nothing to add', () => {
    const health = { '2026-11-26': 3000 };
    expect(addSteps(health, {})).toBe(health);
  });
});
