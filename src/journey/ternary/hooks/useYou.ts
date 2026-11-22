import { useState } from 'react';

import { useSettings } from '@/domain/settings/SettingsContext';
import { TernaryRules } from '@/domain/ternary/models/ternary';

/** Your name (your first name to start with) and a bird picked at random, so few clash. */
export function useYou() {
  const { settings } = useSettings();
  const [name, setName] = useState(settings.firstName);
  const [look, setLook] = useState(() =>
    Math.floor(Math.random() * TernaryRules.LOOKS),
  );
  return { name, setName, look, setLook };
}
