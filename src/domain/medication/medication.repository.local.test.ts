import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import { createLocalMedicationRepository } from './medication.repository.local';
import {
  createMemoryMedicationRepository,
  type Dose,
  type MedicationRepository,
} from './medication.repository';

const byDay = (doses: Dose[]) =>
  [...doses].sort((a, b) =>
    (a.day + a.medicationId).localeCompare(b.day + b.medicationId),
  );

// The local repository has to behave like the memory one the Contexts are tested against.
describe.each<[string, () => Promise<MedicationRepository>]>([
  ['memory', async () => createMemoryMedicationRepository()],
  [
    'local',
    async () => createLocalMedicationRepository(await createMigratedSqlJsDb()),
  ],
])('%s medication repository', (_name, create) => {
  it('records a dose once however often it is taken, and untakes it', async () => {
    const repo = await create();
    await repo.take('m1', '2026-10-18');
    await repo.take('m1', '2026-10-18');
    await repo.take('m2', '2026-10-18');
    expect(byDay(await repo.load('2026-10-18', '2026-10-18'))).toEqual([
      { medicationId: 'm1', day: '2026-10-18' },
      { medicationId: 'm2', day: '2026-10-18' },
    ]);
    await repo.untake('m1', '2026-10-18');
    expect(await repo.load('2026-10-18', '2026-10-18')).toEqual([
      { medicationId: 'm2', day: '2026-10-18' },
    ]);
  });

  it('forgets every dose of a deleted medication', async () => {
    const repo = await create();
    await repo.take('m1', '2026-10-17');
    await repo.take('m1', '2026-10-18');
    await repo.take('m2', '2026-10-18');
    await repo.forget('m1');
    expect(await repo.load('2026-10-01', '2026-10-31')).toEqual([
      { medicationId: 'm2', day: '2026-10-18' },
    ]);
  });
});
