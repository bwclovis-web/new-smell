# Future Payment Strategy

## Overview
Implement a system that limits signups to 100 free users, then requires payment via Stripe for additional signups. When the limit is reached, users attempting to sign up will be redirected to a payment/subscription page.

## Architecture

### Components
1. **User Count Check**: Middleware/utility to check current user count
2. **Signup Gating**: Logic in signup action to enforce limit
3. **Stripe Integration**: Payment processing for paid signups
4. **Payment Page**: Route for subscription/payment
5. **Database Schema**: Track subscription status

## Implementation Details

### 1. Database Schema Updates

**File**: `prisma/schema.prisma`

Add fields to User model:
- `subscriptionStatus`: Enum (free, paid, cancelled)
- `subscriptionId`: String? (Stripe subscription ID)
- `subscriptionStartDate`: DateTime?
- `isEarlyAdopter`: Boolean @default(false) (for first 100 users)

Create migration to add these fields.

### 2. User Count Utility

**File**: `app/utils/user-limit.server.ts` (new)

Create utility functions:
- `getCurrentUserCount()`: Returns count of users with `isEarlyAdopter: true` OR `subscriptionStatus: 'paid'`
- `canSignupForFree()`: Returns boolean if free signups are available
- `FREE_USER_LIMIT`: Constant set to 100

### 3. Update Signup Action

**File**: `app/routes/login/SignUpPage.tsx`

Modify the `action` function:
- Before creating user, check `canSignupForFree()`
- If limit reached, redirect to `/subscribe` with query param `?redirect=/sign-up`
- If under limit, create user with `isEarlyAdopter: true` and `subscriptionStatus: 'free'`

### 4. Stripe Integration Setup

**Dependencies**: Add `stripe` package to `package.json`

**File**: `app/utils/stripe.server.ts` (new)

Create Stripe client and utilities:
- Initialize Stripe with `STRIPE_SECRET_KEY` from env
- `createCheckoutSession()`: Create Stripe checkout session
- `handleWebhook()`: Process Stripe webhooks for subscription events
- `getSubscriptionStatus()`: Check user's subscription status

**Environment Variables**: Add to `.env` and `env_example.txt`:
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key (for frontend)
- `STRIPE_WEBHOOK_SECRET`: Webhook secret for verifying events

### 5. Subscription/Payment Page

**File**: `app/routes/subscribe.tsx` (new)

Create subscription page with:
- Display pricing information
- Stripe Checkout integration
- Handle redirect from signup page
- Show message explaining the 100-user limit

**File**: `app/components/Containers/Subscription/SubscriptionCheckout.tsx` (new)

Component for Stripe Checkout:
- Use Stripe Elements or Checkout Session
- Handle payment success/failure
- Redirect to signup after successful payment

### 6. Webhook Handler

**File**: `app/routes/api/stripe-webhook.tsx` (new)

Handle Stripe webhook events:
- `checkout.session.completed`: Update user subscription status
- `customer.subscription.updated`: Handle subscription changes
- `customer.subscription.deleted`: Handle cancellations
- Verify webhook signature for security

### 7. Update User Creation Logic

**File**: `app/models/user.server.ts`

Modify `createUser()`:
- Accept optional `subscriptionStatus` parameter
- Set `isEarlyAdopter` based on user count
- Set `subscriptionStatus` appropriately

### 8. Post-Payment Signup Flow

**File**: `app/routes/subscribe-success.tsx` (new)

After successful payment:
- Create user account automatically if email matches
- Or redirect to signup with pre-filled email
- Set `subscriptionStatus: 'paid'`

### 9. Environment Configuration

**File**: `app/utils/security/env.server.ts`

Add Stripe environment variables to validation schema:
- `STRIPE_SECRET_KEY`: Required in production
- `STRIPE_PUBLISHABLE_KEY`: Required
- `STRIPE_WEBHOOK_SECRET`: Required in production

### 10. User Query Updates

**File**: `app/models/user.query.ts`

Update user queries to handle subscription status filtering if needed.

## Data Flow

```
User attempts signup
  ↓
Check user count (< 100?)
  ↓
YES → Create free account (isEarlyAdopter: true)
  ↓
NO → Redirect to /subscribe
  ↓
User completes Stripe payment
  ↓
Webhook updates subscription
  ↓
User redirected to signup (or auto-created)
  ↓
Account created with subscriptionStatus: 'paid'
```

## Implementation Tasks

1. **Schema Update**: Update Prisma schema to add subscription fields (subscriptionStatus, subscriptionId, subscriptionStartDate, isEarlyAdopter)
2. **User Limit Utility**: Create user-limit.server.ts utility with getCurrentUserCount() and canSignupForFree() functions
3. **Update Signup Action**: Modify SignUpPage.tsx action to check user limit and redirect to /subscribe if limit reached
4. **Stripe Setup**: Install Stripe package and create stripe.server.ts with client initialization and utility functions
5. **Environment Config**: Add Stripe environment variables to env.server.ts validation and env_example.txt
6. **Subscription Page**: Create /subscribe route with Stripe Checkout integration
7. **Webhook Handler**: Create /api/stripe-webhook route to handle subscription events
8. **Update User Model**: Update createUser() in user.server.ts to handle subscription status
9. **Success Page**: Create /subscribe-success route for post-payment flow
10. **Migration**: Create and run Prisma migration for schema changes

## Testing Considerations

1. Test user count logic at exactly 100 users
2. Test Stripe webhook handling
3. Test payment flow end-to-end
4. Test edge cases (concurrent signups, webhook failures)

## Security Considerations

1. Verify Stripe webhook signatures
2. Use environment variables for Stripe keys
3. Validate user count check is atomic (consider race conditions)
4. Rate limit subscription page to prevent abuse

## Migration Strategy

1. Add new fields to User model with defaults
2. Mark existing users as `isEarlyAdopter: true` (if count < 100)
3. Set `subscriptionStatus: 'free'` for existing users
4. Deploy code changes
5. Configure Stripe account and webhooks
6. Test payment flow in staging

---

## Step-by-step implementation checklist

Use this checklist in order; later steps depend on earlier ones.

### Phase 1: Schema & data

- [x] **1.1** Update `prisma/schema.prisma`
  - [x] Add enum `SubscriptionStatus` with values `free`, `paid`, `cancelled`
  - [x] On `User`: add `subscriptionStatus SubscriptionStatus @default(free)`
  - [x] On `User`: add `subscriptionId String?`
  - [x] On `User`: add `subscriptionStartDate DateTime?`
  - [x] On `User`: add `isEarlyAdopter Boolean @default(false)`
- [x] **1.2** Create and run migration
  - [x] `npx prisma migrate dev --name add_subscription_fields`
  - [ ] (Post-migrate) Backfill existing users: set `isEarlyAdopter: true` and `subscriptionStatus: 'free'` where applicable

### Phase 2: Env & Stripe package

- [ ] **2.1** Add Stripe env to validation
  - [ ] In `app/utils/security/env.server.ts`: add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (required in production)
  - [ ] In `.env.example` or `env_example.txt`: document the three Stripe variables
- [ ] **2.2** Install Stripe
  - [ ] `npm install stripe`
  - [ ] Add types if needed: `npm install -D @types/stripe` (only if not included)

### Phase 3: User limit & signup gating

- [ ] **3.1** Create user-limit utility
  - [ ] Create `app/utils/user-limit.server.ts`
  - [ ] Export `FREE_USER_LIMIT = 100`
  - [ ] Implement `getCurrentUserCount()` (count users where `isEarlyAdopter === true` OR `subscriptionStatus === 'paid'`)
  - [ ] Implement `canSignupForFree(): Promise<boolean>`
- [ ] **3.2** Update user model for signup
  - [ ] In `app/models/user.server.ts`: update `createUser()` to accept optional `subscriptionStatus` and set `isEarlyAdopter` based on count (or caller passes it)
- [ ] **3.3** Gate signup action
  - [ ] In signup route (e.g. `app/routes/login/SignUpPage.tsx` or where signup action lives): at start of action, call `canSignupForFree()`
  - [ ] If `false`, redirect to `/subscribe?redirect=/sign-up` (or your signup path)
  - [ ] If `true`, create user with `isEarlyAdopter: true` and `subscriptionStatus: 'free'`

### Phase 4: Stripe server utilities

- [ ] **4.1** Create Stripe server module
  - [ ] Create `app/utils/stripe.server.ts`
  - [ ] Initialize Stripe with `STRIPE_SECRET_KEY`
  - [ ] Implement `createCheckoutSession()` (e.g. for subscription product/price IDs from env or config)
  - [ ] Implement `getSubscriptionStatus()` (optional; for looking up by subscription ID or customer ID)
  - [ ] Add JSDoc or comments for required env vars

### Phase 5: Subscribe page & checkout UI

- [ ] **5.1** Subscription page route
  - [ ] Create `app/routes/subscribe.tsx`
  - [ ] Read `redirect` query param (e.g. `/sign-up`)
  - [ ] Show copy explaining 100-user limit and that payment is required to sign up
  - [ ] Add CTA that starts Stripe Checkout (or embed Stripe Elements)
- [ ] **5.2** Checkout component (if using Elements)
  - [ ] Create `app/components/Containers/Subscription/SubscriptionCheckout.tsx`
  - [ ] Use Stripe Checkout Session redirect or Stripe Elements; on success redirect to `redirect` param or `/subscribe-success`
  - [ ] Handle errors and display message

### Phase 6: Webhook & post-payment flow

- [ ] **6.1** Stripe webhook route
  - [ ] Create `app/routes/api/stripe-webhook.tsx` (or `.ts` if no UI)
  - [ ] Verify webhook signature using `STRIPE_WEBHOOK_SECRET`
  - [ ] Handle `checkout.session.completed`: set user subscription (e.g. by email or metadata) — create or update user with `subscriptionStatus: 'paid'`, `subscriptionId`, `subscriptionStartDate`
  - [ ] Handle `customer.subscription.updated` and `customer.subscription.deleted` (update or set `subscriptionStatus: 'cancelled'`)
  - [ ] Return 200 quickly; do heavy work in background if needed
- [ ] **6.2** Subscribe-success route
  - [ ] Create `app/routes/subscribe-success.tsx`
  - [ ] Read session or token from query/Stripe; show success message
  - [ ] Redirect to signup with pre-filled email if possible, or link to signup; ensure new user is created with `subscriptionStatus: 'paid'`

### Phase 7: Queries & polish

- [ ] **7.1** User queries
  - [ ] In `app/models/user.query.ts` (or equivalent): add/update any queries that filter by `subscriptionStatus` or `isEarlyAdopter` if needed for admin or gating
- [ ] **7.2** Security & robustness
  - [ ] Ensure webhook handler rejects invalid signatures and returns 4xx on failure
  - [ ] Consider rate limiting on `/subscribe` and/or signup
  - [ ] Consider atomicity for user count check (e.g. transaction or lock) to avoid race past 100

### Phase 8: Testing & deploy

- [ ] **8.1** Tests
  - [ ] Unit: `getCurrentUserCount()` and `canSignupForFree()` at boundary (e.g. 99, 100, 101)
  - [ ] Integration: signup gating redirects to `/subscribe` when at limit
  - [ ] Stripe webhook: verify signature and event handling (e.g. with test payloads)
- [ ] **8.2** Staging & production
  - [ ] Configure Stripe product/price and webhook URL in Stripe Dashboard
  - [ ] Set env vars in staging/production
  - [ ] Run migration on staging; backfill existing users
  - [ ] End-to-end test: signup at limit → pay → signup with paid status
