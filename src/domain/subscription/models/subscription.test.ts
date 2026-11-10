import {
  Plan,
  planName,
  type PlanOption,
  priceLabel,
  savingsLabel,
  sortPlans,
  Tier,
  yearlySavings,
} from './subscription';

const plan = (
  plan: Plan,
  amount: number,
  currency = 'USD',
  tier = Tier.Plus,
): PlanOption => ({
  id: `${tier}-${plan}`,
  plan,
  tier,
  founding: false,
  price: `$${amount.toFixed(2)}`,
  amount,
  currency,
});

describe('Tern Plus plans', () => {
  it('puts Plus yearly first and Supporter last', () => {
    const plans = sortPlans([
      plan(Plan.Annual, 59.99, 'USD', Tier.Supporter),
      plan(Plan.Other, 1),
      plan(Plan.Monthly, 4.99),
      plan(Plan.Annual, 39.99),
    ]);
    expect(plans.map((p) => [p.tier, p.plan])).toEqual([
      [Tier.Plus, Plan.Annual],
      [Tier.Plus, Plan.Monthly],
      [Tier.Plus, Plan.Other],
      [Tier.Supporter, Plan.Annual],
    ]);
  });

  it.each([
    [Plan.Annual, '$29.99 a year'],
    [Plan.Monthly, '$29.99 a month'],
    [Plan.Other, '$29.99'],
  ])('labels a %s price', (p, label) => {
    expect(priceLabel(plan(p, 29.99))).toBe(label);
  });

  it('names Supporter by its tier, and Plus by how it is billed', () => {
    expect(planName({ plan: Plan.Annual, tier: Tier.Supporter })).toBe('Supporter');
    expect(planName({ plan: Plan.Annual, tier: Tier.Plus })).toBe('Yearly');
    expect(planName({ plan: Plan.Monthly, tier: Tier.Plus })).toBe('Monthly');
  });
});

describe('yearlySavings', () => {
  it('is twelve months of monthly less the yearly price', () => {
    expect(
      yearlySavings([plan(Plan.Annual, 39.99), plan(Plan.Monthly, 4.99)]),
    ).toEqual({ amount: 19.89, percent: 33, currency: 'USD' });
  });

  it('weighs Plus against Plus, never Supporter', () => {
    expect(
      yearlySavings([
        plan(Plan.Annual, 59.99, 'USD', Tier.Supporter),
        plan(Plan.Annual, 39.99),
        plan(Plan.Monthly, 4.99),
      ]),
    ).toEqual({ amount: 19.89, percent: 33, currency: 'USD' });
    expect(
      yearlySavings([
        plan(Plan.Annual, 59.99, 'USD', Tier.Supporter),
        plan(Plan.Monthly, 4.99),
      ]),
    ).toBeNull();
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
