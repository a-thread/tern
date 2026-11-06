# Tern Plus: a better paid tier

A proposal, November 2026. The decisions are the owner's. This writes them down with the
reasoning behind them and an order to build them in. It changes no code.

## Where Plus stands

Plus today is one thing: an account. Signed in with Plus, the log lives on Tern's server
(`tern.has_plus()` guards every write), so it follows you to any phone you sign in to. When
Plus ends, the log is copied back to the phone and nothing is lost.

That's honest, but for most free users it isn't much of a reason to pay. The free app is
already backed up: Android Auto Backup and iCloud copy `tern.db`, and Settings › Your data
exports and restores a file. The paywall's first line ("a lost phone loses nothing") is
mostly true without Plus too. What Plus adds that free can't is **more than one phone** and
**anything that needs other people**. This proposal builds on the second.

## Guardrails (unchanged)

- No ads, no data selling.
- Disordered-eating safeguards (hiding numbers, gentle language, turning off streaks and
  goals) always stay free.
- No dark patterns: no countdowns, no "only N left", no guilt, nothing pre-ticked, and
  "Not now" is as easy as "Continue".
- The free local app stays fully usable. Plus adds convenience and company, never basic
  tracking.

## 1. What Plus includes

Scores: value to users (how many would pay for it), build effort at 8 hours a week, ongoing
server cost, and fit with the guardrails.

| Candidate | Value | Build | Server cost | Fit | Decision |
| --- | --- | --- | --- | --- | --- |
| Sync across phones (today's Plus) | Medium | Done | Low | Good | **Keep**, and describe it honestly |
| Ternaries: friends who fly together (see §1a) | High | High (about 6–10 weeks) | Low (small rows, no realtime) | Good only with the rules below | **The new headline**, built after pricing |
| Supporter thank-yous: alternate icons, name in credits | Low–medium (to the people who want it) | Low | None | Good | **Yes**, as the Supporter tier |
| On-device appointment summary for a dietitian or therapist | High for some | Low–medium | None | Good, if free | **Free**: nobody should pay to show their care team their log |
| Live, consent-based share with a clinician | High for some | High | Low | Needs care | **Later**: the clinician-tier bet, after the Apr–Jun 2027 interviews |
| Household: Apple Family Sharing | High for couples | Almost none | Low | Good | **Not now**: it can't be switched off, it's iPhone only, and Play has no equivalent |
| Household: "Plus for two" (a server grant) | High for couples | Medium | Low | Good | **Not now**; revisit after ternaries ship |
| Backup history (30 days of snapshots) | Medium | Medium | Low–medium | Good | Not now: the account already is a backup |
| Longer trends (1 year, all time) | Medium | Low–medium | None | Weak: a paywall on your own history, and long weight charts feed fixating | **No** |
| Home-screen widgets | High | High (native targets on both platforms) | None | Good | Not at 8 hours a week |

### 1a. Ternaries

A small, invite-only circle of friends. Everyone in it has Plus. (Owner's decision: a ternary
is one more reason to subscribe, not a way in for free accounts.) The ternary has **one shared
bird** on its own migration route, moved forward by everyone showing up together. It's
cooperative and nothing is ranked. Each member's own journey carries on as it is.
Encouragement is a few **fixed, kind cheers** ("Flying with you"), never free text, so there
is no diet talk and nothing to moderate. Leaving and blocking are always one tap away.

Food, weight, calorie and step numbers are never shared. What a member can see, and whether
members can earn each other waypoints, is in the research below.

It's called a **ternary**: a pun on tern, and a small circle of friends. "Flock"
was ruled out because of Flock Safety, the surveillance company.

**What a member sees: "here today", nothing more.** Each member shows a soft feather if
they earned any waypoint today; a rest day counts. A quiet member shows nothing: no grey
slot, no "missed", and no history. A member who opts in to *Share that I'm resting* (off by
default) shows a driftwood feather on a rest day.

Two more revealing options were looked at and turned down:
- A week's strip of showed up / rest / blank. The blanks read as failure.
- Each member's stop on the route and their streak. A stop is just a lifetime total, so this
  is a leaderboard in disguise.

**Earning waypoints together.** The way members earn for each other is the shared bird:

| Source | Waypoints | For |
| --- | --- | --- |
| Showing up together | to the shared bird | Each day, 75 × (members who showed up ÷ members). Everyone showing up every day takes it round in about a year, whatever the ternary's size |
| Arrived together | 25, your own bird | Once per stop, when the shared bird reaches it, at most once a week |

- Cheers earn nothing, sent or received. They're only kindness, so cheering never becomes a
  chore and swapping cheers can't farm points. Up to 3 can be sent a day.
- A quiet friend can't cost anyone anything.
- There's no all-together bonus and no ternary streak. A member who doesn't show up only slows
  the bird; it never moves back, and nobody's absence is named.
- The shared bird has its own ledger and never adds to a member's own total. The arrival
  bonus adds at most about 650 waypoints a year, about 2% of a lap's 28,480.
- Days settle the way the ledger already does. Today's showing up follows today as it
  stands. At day's end a row `(ternary, day, showed_up, members)` is written once and never
  recomputed. It holds no user ids, so the bird never jumps back when someone leaves.
- A member whose Plus ends drops out of the count quietly. Nobody else is told why, since
  whether someone pays is their own business.

**Must never happen**
- "You broke the ternary's streak", "X hasn't logged", or any nudge about a named member.
- A member listed as missing, behind or inactive.
- Rankings, or comparing contributions or totals.
- Read receipts on cheers.
- Cheers or showing up that can be bought, banked or spent.
- Any food, weight, calorie, step, streak or stop number passing between members.
- Ternary points protecting a personal streak.

**What it touches**
- A new `src/domain/ternary/`:
  - `TernaryContext.tsx`
  - the repository in its Supabase, local and memory versions
  - `models/sharedBird.ts`: a `TernaryRules` class and a `Cheer` enum
- `WaypointSource.Arrival` in
  `src/domain/waypoints/models/waypoint.ts`, with their labels in `src/journey/models/`.
- A migration:
  - tables `ternaries`, `ternary_members`, `ternary_days` and `ternary_cheers`, with RLS scoped to
    members and `tern.has_plus()`
  - the waypoint source and points checks extended for the new source
  - the day's rows settled on the server, by `pg_cron` or a function beside `plus/`
- `BackendContext.tsx`: wire the new repository.
- Mount `TernaryProvider` at the journey navigator.
- `src/journey/ternary/TernaryScreen.tsx`: a second bird marker on `JourneyMap`, the feathers and
  the cheer buttons.
- A *Share that I'm resting* toggle in Settings.
- Invites by code or link, and leaving and blocking. Apple asks for these for anything
  people put in front of each other, even display names.

## 2. Tiers and prices

Two tiers, both subscriptions. There's no lifetime purchase: the founding price is the
founding offer, and a lifetime purchase would be a server cost carried forever.

| | Monthly | Yearly | Unlocks |
| --- | --- | --- | --- |
| **Tern Plus** | $3.99 | $39.99 (was $29.99) | `plus` |
| **Tern Plus Supporter** | — | $59.99 | `plus` and `supporter` |
| Founding price (testers and the first 200 subscribers) | — | $29.99 while subscribed | `plus` |

After Apple's 15% (the Small Business Program; Play is also 15% on subscriptions), a yearly
subscriber brings in $25.49 at $29.99, $33.99 at $39.99 and $50.99 as a Supporter. With
running costs of about $750 a year, break-even is about 30 subscribers at the founding price
or about 22 at $39.99.

**How the founding price works without code.** Both stores let you raise a subscription's
price and keep existing subscribers on the old one: App Store Connect calls it "Preserve
current price", and Play keeps a legacy price for existing subscribers. So sell $29.99 until
the 200th subscriber (RevenueCat's dashboard shows the count), then raise the price with
existing subscribers kept. Neither store keeps the old price for someone who lets the
subscription lapse and comes back, so the promise has to say **"for as long as you stay
subscribed"**, never "for life". Testers on the `preview` build can't buy anything. They
either subscribe during the founding window or get a manual grant in `tern.entitlements`,
whichever you prefer.

**Supporter** goes in the same subscription group as Plus on iOS (and as a second base plan
or product on Play), so changing tier is an upgrade or a downgrade, never two charges. It has
no monthly plan: it's a yearly thank-you, not a feature tier.

## 3. Paywall and store listing

### Paywall (`src/auth/paywall/PaywallScreen.tsx`)

Subtitle, unchanged: *Everything in Tern stays free. Plus adds an account that keeps your
data safe.*

What Plus adds (`WHAT_PLUS_ADDS`), honest about what free already does:

- Your log on every phone you sign in to, kept on Tern's server
- Fly with friends in a ternary, a small circle whose shared bird is carried by everyone showing up
  *(add this line when ternaries ship, not before)*
- Tern kept going, with no ads and nothing sold

Plans, in order: Yearly (with the savings badge), Monthly, then Supporter. Supporter's
`PlanChoice` gets one plain line under its name: *Everything in Plus, plus alternate tern
icons and your name in the credits, if you'd like it there.* No "most popular" badge on it,
nothing pre-selected toward it, and no wording that makes Plus sound like the lesser choice.

While the founding price is on sale, the yearly plan's badge says *Founding price, kept
while you stay subscribed* instead of the savings line. There's no counter and no "N left".

The small print stays as it is, including *If Plus ever ends, nothing is deleted*.

### Settings (`plusSummary.ts`)

A Supporter's row reads *Tern Plus Supporter · renews {date}*. Everything else is unchanged.

### Store listing (`docs/store-listing.md`)

- Replace *Tern Plus is the one paid part: an account that syncs and backs up* with:
  *Tern Plus is the one paid part: an account that keeps your log on every phone you sign
  in to. Supporter is the same, with a thank-you.* Add the ternary line when ternaries ship.
- App Store "TERN PLUS" terms: *Tern Plus is an optional auto-renewing subscription, monthly
  or yearly; Tern Plus Supporter is yearly.* The rest of Apple's required text stays.
- Promotional text (it can change without a new build) is where the founding price goes:
  *Founding price: Tern Plus is $29.99 a year for the first 200 subscribers, kept for as
  long as you stay subscribed.*

## 4. Build order

1. **Prices, Supporter and wording.** *First, as decided.* Mostly store and RevenueCat setup:
   a `supporter_annual` product, a `supporter` entitlement attached alongside `plus`, both in
   the current offering, and the price raise once 200 is reached.
   Code:
   - `src/domain/subscription/models/subscription.ts`: a tier on `PlanOption` (an enum, not a
     string), `planName` and `priceLabel` for Supporter, and a `supporter` flag on
     `SubscriptionStatus`.
   - `subscription.revenuecat.ts`: map the Supporter package (it arrives as `CUSTOM`, which
     today falls to `Plan.Other`), and read the `supporter` entitlement in `statusFrom`.
   - `subscription.repository.ts`: a Supporter plan in `SAMPLE_PLANS`.
   - `SubscriptionContext.tsx`: expose `supporter`.
   - `PaywallScreen.tsx` and `PlanChoice.tsx`: the new lines, Supporter's description, and the
     founding badge.
   - `src/settings/models/plusSummary.ts`: Supporter wording.
   - `docs/store-listing.md` and the Tern Plus section of `docs/architecture.md`.
   - Tests beside each file.
   - The server is unchanged: Supporter also unlocks `plus`, which is all `tern.has_plus()`
     checks.
2. **Supporter thank-yous.** A Credits screen in Settings (a list kept in the app and updated
   each release; names are added only when someone asks), then alternate app icons through
   an Expo config plugin. Touches `src/settings/` and `app.json`.
3. **Free appointment summary.** A readable summary the phone builds from the log and shares
   through the share sheet. It respects every hidden-number setting and uses no server.
   Touches `src/settings/data/` and the export utilities beside it.
4. **Ternaries.** The big one; see §1a for what it touches.
5. **Later.** Household sharing (Family Sharing or "Plus for two"), backup history, and the
   clinician tier once the interviews are in.
