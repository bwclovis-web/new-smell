# Community and Trust Ideas

A focused doc for extending trader reputation and implementing the Community and trust items from [FUTURE_IDEAS.md](FUTURE_IDEAS.md). All changes are additive (no data deletion).

---

## Current state

- **Trader feedback**: `TraderFeedback` (prisma/schema.prisma) stores one rating (1–5) + optional comment per (traderId, reviewerId). `getTraderFeedbackSummary` returns `averageRating`, `totalReviews`, and `badgeEligible` (true when totalReviews >= 10). Shown on trader profile via `TraderFeedbackSection`.
- **Reviews**: `UserPerfumeReview` has no verified-purchase flag or helpfulness data.
- **Messages**: `TraderContactMessage` has sender, recipient, message, read, createdAt — usable for response-time derivation. No formal trade/transaction model; “successful trades” are only implied when someone leaves TraderFeedback.

---

## 1. Trader reputation score (extend existing system)

**Goal**: Expand the current summary into a richer “trader score”: response time, successful trades, verified badges, plus existing rating and badgeEligible.

- **Schema (additive)**
  - User or new `TraderStats` 1:1: optional cached fields e.g. `avgResponseHours`, `completedTradesCount`, `verifiedTraderAt` (DateTime? for verified badge).
  - Successful trades: (a) treat “has TraderFeedback” as proxy for completed trade (no new table), or (b) add `Trade` / `CompletedTrade` model for explicit count.
- **Response time**: Compute from TraderContactMessage (first message from A → first reply from B per thread); aggregate per trader (e.g. median/avg hours). Expose via server function, optionally cache on User/TraderStats.
- **Verified badges**: Keep badgeEligible (10+ reviews); add optional admin-granted “verified” (e.g. `User.verifiedTraderAt` or TraderBadge table). Display on trader profile and wherever trader is shown.
- **API / loaders**: Extend `getTraderFeedbackSummary` or add `getTraderReputation` returning: averageRating, totalReviews, badgeEligible, avgResponseHours, completedTradesCount, verifiedBadge. Keep backward compatibility.
- **UI**: Trader profile shows full reputation: rating, review count, “Responds within Xh”, “X completed trades”, verified badge(s). Optionally a composite “Trader score” for sorting/filtering.

---

## 2. Verified purchase/trade markers on reviews

- **Schema**: Add to `UserPerfumeReview`: e.g. `verifiedPurchase` Boolean (default false), `verifiedTrade` Boolean (default false). New columns only; existing rows default false.
- **Logic**: When creating/editing a review, let user set “I own/have owned this” or “I traded for this”; optionally check UserPerfume for ownership.
- **UI**: On review cards/detail, show “Verified purchase” or “Verified trade” badge.

---

## 3. Review helpfulness voting and “top review” badges

- **Schema**: New model e.g. `ReviewHelpfulness` or `UserPerfumeReviewVote`: userId, reviewId, vote (helpful / not_helpful or 1/-1), createdAt. Unique (userId, reviewId). Optional denormalized helpfulCount/notHelpfulCount on UserPerfumeReview for sorting.
- **API**: Endpoints to submit and remove vote; loader/query for counts and “top” reviews (e.g. by helpfulCount or net helpful).
- **UI**: “Was this helpful?” (thumbs up/down) on each review; “Top review” badge for highest helpful count per perfume.

---

## 4. Dispute resolution workflow and audit trail

- **Schema**: New models: `Dispute` (id, reporterId, respondentId, subject, description, status: open | in_review | resolved | closed, createdAt, updatedAt, resolutionNotes, resolvedByUserId, resolvedAt) and `DisputeEvent` (id, disputeId, actorId, action, payload/metadata, createdAt). Optionally link to TraderFeedback or TraderContactMessage.
- **Logic**: Create dispute → first DisputeEvent; every status change and admin action appends an event. No row deletion; use status for “closed.”
- **API**: Users create and list their disputes; admins list, update status, add resolution notes, view full event log.
- **UI**: User: “Report a problem” / “Open dispute” from trader profile or feedback; “My disputes” and status. Admin: dispute queue and detail page with timeline (audit trail).

---

## 5. User follow system for houses and traders

- **Schema**: New model e.g. `Follow`: id, followerId (User), followableType enum ('house' | 'trader'), followableId (string), createdAt. followableId = PerfumeHouse.id or User.id. Unique (followerId, followableType, followableId). Indexes for “who does user X follow” and “who follows house/trader Y.”
- **API**: Follow/unfollow house or user; list followers/following; optional “followed” in nav or profile.
- **UI**: “Follow” button on house pages and trader profiles; “Following” list (and later: “New listing from a house you follow” etc.).

---

## Implementation checklist

Use this checklist as you implement. Suggested order: 1 → 2 → 3 → 4 → 5 (dispute last).

### 1. Trader reputation score

- [ ] Add schema: User or TraderStats fields (`avgResponseHours`, `completedTradesCount`, `verifiedTraderAt`) and migration
- [ ] Implement response-time computation from TraderContactMessage (server function)
- [ ] Decide and implement “completed trades” (feedback count vs Trade model)
- [ ] Implement or extend getTraderReputation / getTraderFeedbackSummary (avgResponseHours, completedTradesCount, verifiedBadge)
- [ ] Add verified badge grant (admin: set verifiedTraderAt or TraderBadge)
- [ ] Update trader profile UI: response time, completed trades, verified badge(s)
- [ ] Optional: composite “Trader score” and use in sort/filter

### 2. Verified purchase/trade on reviews

- [ ] Add `verifiedPurchase` and/or `verifiedTrade` to UserPerfumeReview; migration (default false)
- [ ] Review create/edit: allow user to set verified flags (optional ownership check via UserPerfume)
- [ ] Review display: show “Verified purchase” / “Verified trade” badge on cards and detail

### 3. Review helpfulness and top review

- [ ] Add ReviewHelpfulness / UserPerfumeReviewVote model and migration
- [ ] Optional: denormalized helpfulCount/notHelpfulCount on UserPerfumeReview
- [ ] API: submit vote, remove vote; loader/query for counts and top review per perfume
- [ ] UI: “Was this helpful?” (thumbs up/down) on each review
- [ ] UI: “Top review” badge and/or sort by helpfulness

### 4. User follow system

- [ ] Add Follow model (followerId, followableType, followableId) and migration
- [ ] API: follow/unfollow house or user; list followers/following
- [ ] UI: Follow button on house pages and trader profiles
- [ ] UI: “Following” list (e.g. in profile or nav); optional activity later

### 5. Dispute resolution and audit trail

- [ ] Add Dispute and DisputeEvent models and migrations
- [ ] API: user create dispute, list own disputes; admin list, update status, resolution notes, event log
- [ ] Logic: create DisputeEvent on create and on every status/action
- [ ] UI: “Report a problem” / “Open dispute” from trader profile or feedback
- [ ] UI: User “My disputes” and status
- [ ] UI: Admin dispute queue and detail page with timeline (audit trail)

### Docs and sync

- [ ] Update [FUTURE_IDEAS.md](FUTURE_IDEAS.md) checklist: mark Community and trust items as done as you ship them (and add short “Implemented: …” notes if desired)
