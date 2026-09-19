import React from 'react';
import { SettingsProvider } from '@settings/SettingsContext';
import { FoodProvider } from '@food/FoodContext';
import { WeightProvider } from '@weight/WeightContext';
import { WaypointsProvider } from '@journey/WaypointsContext';

/**
 * Composition root for all app-wide state. Each domain owns its own
 * context (see the sibling *Context.tsx files) so a change in one — e.g.
 * toggling a Settings switch — doesn't re-render screens that only read
 * another domain. WaypointsProvider must nest inside FoodProvider: it
 * reads foodLog to keep the "logging all meals" bonus honest.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <FoodProvider>
        <WeightProvider>
          <WaypointsProvider>{children}</WaypointsProvider>
        </WeightProvider>
      </FoodProvider>
    </SettingsProvider>
  );
}
