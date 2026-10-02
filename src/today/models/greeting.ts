export function greetingFor(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Hello';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}