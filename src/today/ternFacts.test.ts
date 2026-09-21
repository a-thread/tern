import { TERN_FACTS, factForDay } from './ternFacts';
import { addDays } from '@shared/utils/date';

describe('TERN_FACTS', () => {
  it('has plenty of distinct, short facts', () => {
    expect(TERN_FACTS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(TERN_FACTS).size).toBe(TERN_FACTS.length);
    for (const fact of TERN_FACTS) {
      expect(fact.trim()).toBe(fact);
      expect(fact.length).toBeGreaterThan(20);
      expect(fact.length).toBeLessThanOrEqual(200);
    }
  });
});

describe('factForDay', () => {
  it('shows the same fact all day', () => {
    expect(factForDay('2026-09-21')).toBe(factForDay('2026-09-21'));
  });

  it('moves to the next fact each day, and cycles through the whole list', () => {
    const start = '2026-09-21';
    const shown = Array.from({ length: TERN_FACTS.length }, (_, i) => factForDay(addDays(start, i)));
    expect(new Set(shown).size).toBe(TERN_FACTS.length);
    expect(factForDay(addDays(start, TERN_FACTS.length))).toBe(factForDay(start));
    expect(factForDay(addDays(start, 1))).not.toBe(factForDay(start));
  });

  it('works for dates before 1970 too', () => {
    expect(TERN_FACTS).toContain(factForDay('1960-01-01'));
  });
});
