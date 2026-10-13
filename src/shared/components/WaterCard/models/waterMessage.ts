/** A short, warm line for how far along today's water is. Never a scold: only cheers on the way up. */
export function waterMessage(progress: number, drinks: number): string {
  if (progress >= 1) return 'Goal reached. Nicely done.';
  if (drinks === 0) return 'A fresh glass, whenever you are ready.';
  if (progress >= 0.75) return 'Nearly there.';
  if (progress >= 0.5) return 'Over halfway.';
  if (progress >= 0.25) return 'Off to a good start.';
  return 'The first sips count.';
}
