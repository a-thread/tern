/** Names only the bar settings that exist for what's tracked, and only while bars are on. */
export function intakeBarsNote({
  trackCalories,
  trackMacros,
  showIntakeBars,
}: {
  trackCalories: boolean;
  trackMacros: boolean;
  showIntakeBars: boolean;
}): string {
  const plain = 'Bars never turn red or warn you.';
  if (!showIntakeBars) return plain;
  const parts = [
    ...(trackCalories ? ['calorie zone'] : []),
    ...(trackMacros ? ['protein minimum'] : []),
  ];
  if (!parts.length) return plain;
  return `${plain} Set your ${parts.join(' and ')} under Settings → Food → Calorie & macro targets.`;
}
