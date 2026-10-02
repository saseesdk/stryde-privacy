---
title: Stryde Privacy Policy
---

# Stryde Privacy Policy

_Last updated: 26 September 2026_

Stryde ("the app", "we") is a step-tracking app that rewards walking with
in-app coins and lets you compete on leaderboards and with friends. This
policy explains what data the app handles and how.

## Data we collect

| Data | Source | Why | Where it goes |
|---|---|---|---|
| Email address | You, at sign-up | Account login and recovery | Stored with our backend provider (Supabase) |
| Username, display name, avatar image | You | Your public identity on leaderboards | Stored in our database; username/avatar visible to other users |
| Daily step totals | Health Connect (Android) / HealthKit (iOS), with your permission | Progress display, coin rewards, leaderboards | Stored in our database as one total per day |
| Coin balance, XP, level, streaks | Computed by our servers from your step totals | Rewards and gamification | Stored in our database |
| Timezone | Your device, synced automatically | Bucketing your steps into the correct local day | Stored in our database |
| Precise location (GPS) | Your device, while a run is active, with your permission | Tracing the route of a run so a closed loop can claim map territory | The finished route (a series of coordinates) is stored in our database and shown on the map; live location is never broadcast to other users |
| Advertising identifier, ad interaction data | Google AdMob (via the app's ad SDK) | Serving rewarded ads that credit coins, and (if you allow tracking) more relevant ads | Collected and processed by Google/AdMob under their own privacy policy; see below |

## Location data

- The app requests **precise (GPS) location** only to trace the route of a
  run you start yourself, so a closed loop can be claimed as territory on
  the map. Location is not collected in the background outside of an
  active run.
- A run's finished path is stored in our database and shown on your own
  map and (if territory sharing is on) on public/team leaderboards as a
  claimed shape — not as a live, moving position. Other users never see
  where you currently are.
- You can deny location access and still use the step-tracking and
  leaderboard features; only the Map/territory feature requires it.

## Advertising

- The app shows rewarded ads (watch an ad, earn coins) via Google AdMob.
  AdMob and its ad-network partners may collect an advertising
  identifier and ad-interaction data to serve and measure ads, and — if
  you consent via the App Tracking Transparency prompt (iOS) or your
  device's ad settings (Android) — to personalize them.
- This data is collected and processed by Google/AdMob directly, under
  their own privacy policy (https://policies.google.com/privacy), not
  stored on our servers.
- Declining tracking permission doesn't stop ads from showing — you'll
  just see non-personalized ones instead.

## Health data — what we read and what we don't

- We request **read access to step counts only** via Health Connect
  (Android). We never read heart rate, location, sleep, workouts, or any
  other health data.
- Only **daily step totals** leave your device (a single number per day).
  Raw sensor data, per-minute activity, and step timestamps stay on your
  phone.
- Health data is **never sold, shared with third parties, or used for
  advertising**. It is used solely to power the features you see in the
  app: your progress ring, coins, streaks, and leaderboards.
- You can revoke step access anytime in Health Connect; the app keeps
  working with syncing paused.

## What other users see

- Your username, avatar, level, and period step totals appear on public
  leaderboards **only while "Show me on leaderboards" is enabled** in your
  profile (on by default; you always see your own row).
- If you join a team, its members can see your username, avatar, and step
  totals within that team. Leaving the team stops this.

## Storage and security

Data is stored with Supabase (hosted Postgres) protected by row-level
security: your step and coin records are readable only by you, and all
coin awards are computed server-side. The app communicates with the
backend exclusively over HTTPS.

## Data retention and deletion

Your data is kept while your account exists. To delete your account and
all associated data (profile, steps, coins, team memberships), contact us
at the address below; deletion cascades through all records.

## Children

Stryde is not directed at children under 13, and we do not knowingly
collect data from them.

## Changes

We will update this page and the "last updated" date when this policy
changes materially.

## Contact

Questions or deletion requests: **saseesdk@gmail.com**
