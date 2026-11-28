import { TernaryRules } from './models/ternary';
import { createMemoryTernaryRepository } from './ternary.repository';
import { sampleTernary } from './ternary.mock';

const TODAY = '2026-11-28';
const meal = (name: string) => ({ name, foods: ['Rice'] });

describe('sharing meals at a stop', () => {
  const yoursAt = async (
    repo: ReturnType<typeof createMemoryTernaryRepository>,
    stop: string,
  ) =>
    (await repo.mine(TODAY))!.dishes.filter((d) => d.yours && d.stop === stop);

  it('shares several, up to the limit', async () => {
    const repo = createMemoryTernaryRepository(sampleTernary(TODAY));
    for (let i = 1; i <= TernaryRules.MAX_MEALS_PER_STOP; i++) {
      await repo.bringDish('1-iceland', meal(`Meal ${i}`));
    }
    expect(await yoursAt(repo, '1-iceland')).toHaveLength(
      TernaryRules.MAX_MEALS_PER_STOP,
    );
    await expect(repo.bringDish('1-iceland', meal('One more'))).rejects.toThrow(
      /all the meals/,
    );
  });

  it('updates a meal shared again instead of adding a second', async () => {
    const repo = createMemoryTernaryRepository(sampleTernary(TODAY));
    await repo.bringDish('1-iceland', meal('Soup'));
    await repo.bringDish('1-iceland', { name: 'Soup', foods: ['Leeks'] });
    const yours = await yoursAt(repo, '1-iceland');
    expect(yours).toHaveLength(1);
    expect(yours[0].foods).toEqual(['Leeks']);
  });

  it('treats a name with stray spaces as the same meal, as the server does', async () => {
    const repo = createMemoryTernaryRepository(sampleTernary(TODAY));
    await repo.bringDish('1-iceland', meal('Soup'));
    await repo.bringDish('1-iceland', meal(' Soup '));
    const yours = await yoursAt(repo, '1-iceland');
    expect(yours.map((d) => d.name)).toEqual(['Soup']);
  });

  it('takes back only a meal you shared', async () => {
    const repo = createMemoryTernaryRepository(sampleTernary(TODAY));
    await repo.bringDish('1-iceland', meal('Soup'));
    const [yours] = await yoursAt(repo, '1-iceland');
    await repo.removeDish(yours.id);
    await repo.removeDish('d1');
    const dishes = (await repo.mine(TODAY))!.dishes;
    expect(dishes.some((d) => d.yours)).toBe(false);
    // Maya's (d1) stays: it isn't yours to take back.
    expect(dishes.some((d) => d.id === 'd1')).toBe(true);
  });
});
