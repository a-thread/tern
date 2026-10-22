import {
  Plan,
  type PlanOption,
  priceLabel,
  savingsLabel,
  sortPlans,
  yearlySavings,
} from './subscription';

const plan = (
  plan: Plan,
  amount: number,
  currency = 'USD',
): PlanOption => ({
  id: plan,
  plan,
  price: `$${amount.toFixed(2)}`,
  amount,
  currency,
});

describe('Tern Plus plans', () => {
  it('puts yearly first', () => {
    const plans = sortPlans([
      plan(Plan.Other, 1),
      plan(Plan.Monthly, 3.99),
      plan(Plan.Annual, 29.99),
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
  ])('labels a %s price', (p, label) => {
    expect(priceLabel(plan(p, 29.99))).toBe(label);
  });
});

describe('yearlySavings', () => {
  it('is twelve months of monthly less the yearly price', () => {
    expect(
      yearlySavings([plan(Plan.Annual, 29.99), plan(Plan.Monthly, 3.99)]),
    ).toEqual({ amount: 17.89, percent: 37, currency: 'USD' });
  });

  it('is nothing without both plans, across currencies, or when yearly costs more', () => {
    expect(yearlySavings([plan(Plan.Annual, 29.99)])).toBeNull();
    expect(
      yearlySavings([plan(Plan.Annual, 29.99, 'EUR'), plan(Plan.Monthly, 3.99)]),
    ).toBeNull();
    expect(
      yearlySavings([plan(Plan.Annual, 60), plan(Plan.Monthly, 3.99)]),
    ).toBeNull();
  });
});

describe('savingsLabel', () => {
  it('names the amount in the currency', () => {
    expect(savingsLabel({ amount: 17.89, percent: 37, currency: 'USD' })).toMatch(
      /^Save .*17\.89.* a year$/,
    );
  });

  it('falls back to the percentage for a currency it cannot format', () => {
    expect(savingsLabel({ amount: 17.89, percent: 37, currency: 'not a code' })).toBe(
      'Save 37%',
    );
  });
});
