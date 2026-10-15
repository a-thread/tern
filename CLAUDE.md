# Tern — React Native Standards

Expo / React Native / TypeScript. All app code lives under `src/`.

**Imports**: use a relative path when the target is at most two levels up (`./x`, `../x`,
`../../x`). Reaching into `shared/` from outside it always uses the `@shared/` alias
(`@shared/theme` is `src/shared/theme`). Anything else further away uses `@/`, which is `src/`
(`@/domain/food/FoodContext`), rather than a `../../../` chain.

## Folder Structure

```
src/
  AppProviders.tsx  AuthGate.tsx  BackendContext.tsx  providerOrder.ts   composition root
  navigation/                   RootNavigator, the route registry (types.ts), useAppNavigation
  <tab or flow>/                today, food, trends, journey, settings, auth, movement, check-in, log-weight
    <Name>Screen.tsx            one screen, or <Name>Stack.tsx for a navigator
    <screen>/                   a sub-screen: its own folder, same shape as this one
      <Name>Screen.tsx
      components/<Name>/<Name>.tsx          one folder per component, with its test beside it
      hooks/  models/  utils/               only what this screen's components share
    components/ hooks/ models/ utils/       used by 2+ screens of this tab
  domain/<name>/                data and rules used across tabs: <Name>Context.tsx, <name>.repository.ts,
                                .repository.supabase.ts, .mock.ts, models/, hooks/, sources/
  shared/                       anything used by more than one tab or feature (UI, hooks, utils), generic or not: components/ (ui/, charts…),
                                hooks/, models/, state/, theme/, backend/, utils/
```

### Where a file goes

1. **Used by one screen** → inside that screen's folder.
2. **Used by one component** → inside that component's folder, in its own `components/`, `hooks/`,
   `models/` or `utils/`. A subcomponent used only by `FoodGroup` lives in `FoodGroup/components/`.
3. **Used by several components of the same screen or tab** → the closest common parent's
   `components/`, `hooks/`, `models/` or `utils/`.
4. **Used across tabs** → `domain/<name>/` if it is about the app's data or rules (a Context, a
   repository, a model, a hook that reads them), `shared/` if it is UI or plumbing several tabs use (it may read `domain/`, e.g. `FoodSummary`).
5. `shared/` means used by **more than one component or util**. One consumer means it moves next to
   that consumer. When a second tab starts using something, promote it then, not before.
6. Models, hooks and utils ship alongside the components that use them, the same way.
7. Only create a folder when it has a file in it. A component gets a folder (`Name/Name.tsx`) so
   its private pieces and its test have somewhere to live.

## Layers

| Layer | Lives in                         | Rule                                                                                    |
| ----- | -------------------------------- | --------------------------------------------------------------------------------------- |
| Data  | `domain/<name>/*.repository*.ts` | I/O only. No React, no state. Behind an interface; the in-memory one is what tests use. |
| Rules | `models/`, `utils/`              | Pure functions, types and constants. Never import React, a Context or a repository.     |
| State | `domain/<name>/*Context.tsx`     | Composes a repository. Owns the actions. Exposes what the UI reads.                     |
| UI    | screens, `components/`, `hooks/` | Reads the Context and wires the view. No business rules.                                |

- Only `BackendContext` (and tests) may import a repository. Screens ask their Context.
- Components inside a screen read their Context directly; **props are for `shared/` components**.
- State that belongs to one flow is provided at that flow's navigator; only app-wide state is
  mounted in `AppProviders`.
- Dependencies point down: `domain` → `shared` → screens → `app`. `shared/` may read `domain/`; `domain/` never imports `shared/components`. A screen never imports another tab's
  folder; if two tabs need something, it goes to `domain/` or `shared/`.

## Conventions

- **Constants live in classes**: `static readonly` members (`WaterLimits.MAX_DRINK_OZ`), not loose
  `UPPER_CASE` exports. A lone constant may stay a `const`.
- **Enums, not string unions**, for a closed set that is compared or switched on (`DayState`,
  `Meal`, `Frequency`, `TrendRange`). Compare with the member, never a literal.
- **No generic names** (`types.ts`, `helpers.ts`, `components.tsx`) and **no barrel `index.ts`** files.
  Import the real file. The one exception is `@shared/components/ui`, the shared primitives
  (`Group`, `Row`, `Icon`, `Stepper`…), which every screen uses.
- **Keep import lists short**: one import line per module (lint enforces it), and when a screen pulls
  in many Contexts just to wire one behaviour (pull to refresh across six of them), put that in a hook
  beside the screen (`useTodayRefresh`) so the screen imports one thing.
- **Tokens, not literals**: colors, fonts, radii and spacing come from `@shared/theme`
  (`colors.danger`, `typography.caption`, `space.md`). Don't hand-write a font/size/color combo that
  a `typography` token already covers.
- **Repositories**: `ok(query)` for writes and `rows<T>(query)` for selects (`@shared/backend/query`).
- **Contexts** load with `useLoader`, save with `usePersist`, or use `useSyncedList` for an
  optimistic list. Create them with `createRequiredContext`.
- **Confirmations** use `confirm()` from `@shared/utils/confirm`, not `Alert.alert` directly.
- **Health data**: steps and workouts come from the phone's health app through `createHealthStepsRepository`
  / `createHealthWorkouts` (Apple Health on iPhone, Health Connect on Android); adapters take a small
  interface (`HealthKitApi`) so they test without the native library. Say "Apple Health" or "Health
  Connect" in the UI with `healthAppName()`, never a literal.
- Navigation: `useRootNavigation()` / `useSettingsNavigation()`, not a hand-typed `useNavigation<…>()`.
- One component, one responsibility; if it does two things, split it.

## Accessibility

- Every icon-only button gets an `accessibilityLabel`; buttons get `accessibilityRole='button'`.
- Inputs have an `accessibilityLabel`. Errors are shown next to the field, not only as a color.
- Touch targets use `hitSlop` when the visible control is small.

## Anti-patterns

- A file in `shared/` that only one component uses.
- A screen importing from another tab's folder.
- Prop-drilling inside a screen instead of reading the Context.
- A repository imported outside `BackendContext` and tests.
- A string-literal union for a value compared more than once.
- A `../../../` chain (three or more levels up) instead of `@/`, or a relative path into `shared/` instead of `@shared/`.

## Verification

Run all three before calling a change done:

- `npm run typecheck`
- `npm run lint`
- `npx jest --ci`

Anything visual also needs a look in the app (`npx expo start`).

## References

- Architecture and storage: `docs/architecture.md`
- Design tokens and commitments: `docs/design.md`
- React Navigation: https://reactnavigation.org
