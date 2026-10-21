import { Plan, priceLabel, sortPlans } from './subscription';

describe('Tern Plus plans', () => {
  it('puts yearly first', () => {
    const plans = sortPlans([
      { id: 'o', plan: Plan.Other, price: '$1.00' },
      { id: 'm', plan: Plan.Monthly, price: '$3.99' },
      { id: 'a', plan: Plan.Annual, price: '$29.99' },
    ]);
    expect(plans.map((p) => p.plan)).toEqual([
      Plan.Annual,
      Plan.Monthly,
      Plan.Other,
    ]);
  });

  it.each([
    [Plan.Annual, '$29.99 a year'],
    [Plan.Monthly, '$29.99 a month'],
    [Plan.Other, '$29.99'],
  ])('labels a %s price', (plan, label) => {
    expect(priceLabel({ id: 'x', plan, price: '$29.99' })).toBe(label);
  });
});
