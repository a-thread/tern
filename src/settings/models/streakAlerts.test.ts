import { planStreakAlerts, StreakAlerts } from './streakAlerts';
import { DINNER_MESSAGES, LUNCH_MESSAGES, dayNumber, variantFor } from './mealMessages';

const at = (h: number) => new Date(2026, 9, 5, h, 0);
const base = { on: true, streak: 9, freezes: 0, todayOpen: true, now: at(15) };

describe('planStreakAlerts', () => {
  it('plans an evening heads-up and a next-morning outcome while a streak is open', () => {
    const plan = planStreakAlerts(base);
    expect(plan.map((a) => a.id)).toEqual([StreakAlerts.AT_RISK_ID, StreakAlerts.OUTCOME_ID]);
    expect(plan[0].at).toEqual(at(20));
    expect(plan[1].at).toEqual(new Date(2026, 9, 6, 9, 0));
    expect(plan[0].body).toMatch(/\b(9|10)\b/);
  });

  it('plans nothing when off, with no streak, or once today is settled', () => {
    expect(planStreakAlerts({ ...base, on: false })).toEqual([]);
    expect(planStreakAlerts({ ...base, streak: 0 })).toEqual([]);
    expect(planStreakAlerts({ ...base, todayOpen: false })).toEqual([]);
  });

  it('skips the evening heads-up once it has passed', () => {
    const plan = planStreakAlerts({ ...base, now: at(21) });
    expect(plan.map((a) => a.id)).toEqual([StreakAlerts.OUTCOME_ID]);
  });

  it('says a freeze covered the day when one is held, and that the streak ended otherwise', () => {
    const [, frozen] = planStreakAlerts({ ...base, freezes: 1 });
    expect(`${frozen.title} ${frozen.body}`.toLowerCase()).toMatch(/freeze|protected/);
    const [, ended] = planStreakAlerts(base);
    expect(`${ended.title} ${ended.body}`.toLowerCase()).not.toMatch(/freeze/);
  });

  it('stays kind: no shame or urgency words', () => {
    for (const freezes of [0, 1]) {
      const text = planStreakAlerts({ ...base, freezes })
        .map((a) => `${a.title} ${a.body}`)
        .join(' ')
        .toLowerCase();
      expect(text).not.toMatch(/lose|lost|fail|hurry|last chance|don’t break/);
    }
  });
});

describe('meal messages', () => {
  it('has varied lunch and dinner wording, none of it about calories or what was missed', () => {
    for (const pool of [LUNCH_MESSAGES, DINNER_MESSAGES]) {
      expect(new Set(pool.map((m) => m.body)).size).toBe(pool.length);
      const text = pool.map((m) => `${m.title} ${m.body}`).join(' ').toLowerCase();
      expect(text).not.toMatch(/streak|calorie|lose|loss|goal|behind|miss/);
    }
  });

  it('never repeats a message on consecutive days', () => {
    for (let i = 0; i < 30; i++) {
      const a = new Date(2026, 9, 5 + i);
      const b = new Date(2026, 9, 6 + i);
      expect(variantFor(LUNCH_MESSAGES, dayNumber(a))).not.toBe(variantFor(LUNCH_MESSAGES, dayNumber(b)));
    }
  });
});
