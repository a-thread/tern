/**
 * The note under "Show intake bars": the settings for the bars live under Calorie & macro
 * targets, and it names only those that exist for what's tracked (a calorie zone needs
 * calories, a protein minimum needs macros), and only while the bars are on.
 */
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
