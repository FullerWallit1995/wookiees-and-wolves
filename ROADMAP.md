# Wookiees & Wolves App Roadmap

The roadmap for the Wookiees & Wolves mobile app.

The goal is to keep the app focused on what makes W&W unique:
the podcast, Minnesota Timberwolves basketball, Star Wars, The Den community,
and the Wolves Predictor.

---

# 🚀 PRE-LAUNCH POLISH

## Guest Experience

- [ ] Create a guest preview/teaser for the Predictor Leaderboard
  - Show the structure of the leaderboard
  - Blur or use placeholder leaderboard entries
  - Encourage account creation without exposing actual results

- [ ] Review every signed-out experience
  - Home
  - Predictor
  - Leaderboard
  - The Den
  - Profile

## The Den

- [ ] Improve public interaction-count architecture
  - Guests should be able to see like totals and poll results/counts
  - Do not expose raw user IDs through public `post_likes` or `poll_votes` queries

- [ ] Final Den empty/loading/error-state review

## Authentication

- [ ] Add Forgot Password / Password Reset flow
- [ ] Add email verification
- [ ] Verify auth return behavior from every entry point
  - Profile
  - Predictor
  - Leaderboard
  - The Den

## Android

- [ ] Create proper Android adaptive icon using W&W branding
- [ ] Test Android layout and navigation
- [ ] Test authentication on Android
- [ ] Test Predictor on Android
- [ ] Test The Den on Android
- [ ] Test external podcast links on Android

## Final App Polish

- [ ] Final visual consistency pass
- [ ] Review spacing and typography on physical devices
- [ ] Review all loading states
- [ ] Review all error states
- [ ] Review all empty states
- [ ] Review all external links
- [ ] Test on multiple screen sizes where possible

---

# 📦 RELEASE PREP

## Standalone Builds

- [ ] Create standalone iOS build that does not require Metro
- [ ] Create standalone Android build
- [ ] Test production environment configuration
- [ ] Confirm Supabase production configuration

## Apple / Google Distribution

- [ ] Decide when to enroll in Apple Developer Program
- [ ] Configure production iOS signing
- [ ] Configure Android production signing
- [ ] Set final bundle/package identifiers
- [ ] Prepare App Store listing
- [ ] Prepare Google Play listing

## Store Assets

- [ ] Final app icon
- [ ] Screenshots
- [ ] App description
- [ ] Short promotional description
- [ ] Keywords/categories
- [ ] Support URL
- [ ] Wookiees & Wolves website links

## Legal / Privacy

- [ ] Create app Privacy Policy
- [ ] Create Terms of Use if appropriate
- [ ] Add Privacy Policy link inside app
- [ ] Add account/data deletion process
- [ ] Review Star Wars / Timberwolves trademark and branding exposure
- [ ] Review app-store requirements for user-generated/community content

---

# 🛠 V1.1 / EARLY IMPROVEMENTS

These should be driven heavily by how people actually use V1.

## Predictor

- [ ] Predictor history
- [ ] Previous-season results
- [ ] Personal prediction history
- [ ] Expanded leaderboard statistics
- [ ] Predictor achievements/badges
- [ ] Consider streak statistics
- [ ] Consider monthly Predictor performance

## The Den

- [ ] Improve community profiles
- [ ] Show more member activity
- [ ] Consider comments/replies
- [ ] Consider reactions beyond likes
- [ ] Consider richer polls
- [ ] Consider community-created posts
- [ ] Moderation tools if community posting is introduced

## Podcast

- [ ] Improve episode artwork presentation
- [ ] Consider episode detail pages
- [ ] Consider clips inside the app
- [ ] Consider Dispatches integration
- [ ] Improve podcast discovery/navigation based on user feedback

---

# 📈 GROWTH FEATURES

These become more valuable if W&W develops a meaningful active user base.

## Push Notifications

- [ ] Restore `expo-notifications`
- [ ] Restore notification preference system
- [ ] Predictor pick reminders
- [ ] New episode notifications
- [ ] New Den post/poll notifications
- [ ] Notification deep linking
- [ ] User-controlled notification preferences

> Push notifications currently require moving beyond the free iOS Personal Team
> development setup, so this feature is intentionally deferred.

## Authentication Upgrades

- [ ] Sign in with Apple
- [ ] Sign in with Google
- [ ] Passkeys / passwordless authentication
- [ ] Account linking between authentication methods

## Community

- [ ] Mentions
- [ ] Replies
- [ ] Community notifications
- [ ] Member profiles
- [ ] Follow/friend functionality if it fits the community
- [ ] Admin/moderator tooling

---

# 🌌 LONG-TERM IDEAS

Ideas worth preserving without letting them distract from V1.

## Predictor Expansion

- [ ] Historical Predictor seasons
- [ ] Career Predictor stats
- [ ] Achievement system
- [ ] Predictor trophies/badges
- [ ] Head-to-head comparisons
- [ ] Private groups/leagues
- [ ] Additional prediction games

## W&W Platform

- [ ] Deeper integration with wookieesandwolves.com
- [ ] Dispatches inside the app
- [ ] Podcast clips feed
- [ ] Community questions for podcast episodes
- [ ] Submit questions/topics to Austin & Nick
- [ ] Featured community takes
- [ ] Website ↔ app account integration where useful

## Fun / Experimental

- [ ] Expand Aurebesh tools
- [ ] Star Wars community games
- [ ] Wolves trivia
- [ ] Star Wars trivia
- [ ] W&W achievements
- [ ] Easter eggs

---

# 🅿️ NOT NOW

Good ideas that are deliberately not priorities.

- Push notifications
- Apple sign-in
- Google sign-in
- Passkeys
- Full social-network functionality
- Direct messaging
- Complex community moderation systems
- Monetization systems
- In-app purchases
- Paid subscriptions

These can move onto the active roadmap when usage justifies the additional
complexity or cost.

---

# ✅ COMPLETED FOUNDATIONS

## Core App

- [x] Expo / React Native app
- [x] Native iOS development build
- [x] Wookiees & Wolves app name
- [x] W&W app icon
- [x] W&W branded splash screen
- [x] Bottom-tab navigation
- [x] Native-device QA

## Podcast

- [x] RSS-powered episode feed
- [x] Latest Episode Home card
- [x] Episodes library
- [x] Spotify episode links
- [x] YouTube episode links
- [x] Apple Podcasts show link
- [x] Episode pagination

## Accounts & Profiles

- [x] Supabase authentication
- [x] Email/password signup
- [x] Email/password login
- [x] Persistent sessions
- [x] User profiles
- [x] Unique usernames
- [x] Display names
- [x] Profile avatars
- [x] Supabase Storage avatar uploads
- [x] Admin/member roles
- [x] Database protection against user self-promotion to admin

## The Den

- [x] Pack and Cantina feeds
- [x] Posts
- [x] Polls
- [x] Likes
- [x] Voting
- [x] Vote changes
- [x] Authentication-gated interactions
- [x] Persistent likes/votes
- [x] Published-content RLS protections

## Wolves Predictor

- [x] Full 82-game schedule
- [x] Supabase-powered schedule
- [x] Game-by-game W/L picks
- [x] Account required for picks
- [x] Cloud-saved predictions
- [x] Per-game lock times
- [x] Database-enforced game locks
- [x] Locked-pick preservation
- [x] Clear Open Picks
- [x] Monthly schedule sections
- [x] Expand All / Collapse All
- [x] Monthly pick-status indicators
- [x] Next Game Lock card
- [x] Official game results
- [x] Prediction grading
- [x] Prediction accuracy
- [x] Correct / incorrect statistics

## Predictor Leaderboard

- [x] Supabase leaderboard
- [x] 10-completed-game opening gate
- [x] 10-graded-pick qualification requirement
- [x] Accuracy ranking
- [x] Graded-pick tiebreaker
- [x] Correct-pick tiebreaker
- [x] Current-user highlighting
- [x] Qualification progress
- [x] Signed-out access gate
- [x] Auth refresh when returning from sign-in

## Security / Backend

- [x] Profile RLS
- [x] Post/poll RLS
- [x] Like/vote ownership protections
- [x] Predictor ownership protections
- [x] Database Predictor game-lock enforcement
- [x] Removed user ability to delete entire Predictor history
- [x] Avatar Storage ownership policies
- [x] Admin-role protection

## Development Health

- [x] TypeScript: zero errors
- [x] Expo Doctor: 21/21 checks passing
- [x] Native iPhone testing
- [x] Git/GitHub checkpoints