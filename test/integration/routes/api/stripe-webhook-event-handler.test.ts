/**
 * Unit-style tests for handleStripeWebhookEvent (Phase 8.1).
 * Uses mock deps so no real DB; tests event handling with test payloads.
 *
 * @group integration
 * @group api
 * @group stripe
 */

import type Stripe from "stripe"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Use real @prisma/client so SubscriptionStatus enum is available when route uses it.
// Explicitly re-export SubscriptionStatus so it is present even if a global mock overrides the module.
vi.mock("@prisma/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@prisma/client")>()
  const SubscriptionStatus =
    actual?.SubscriptionStatus ?? ({ free: "free", paid: "paid", cancelled: "cancelled" } as const)
  return {
    ...actual,
    SubscriptionStatus,
  }
})

import {
  handleStripeWebhookEvent,
  type StripeWebhookDeps,
} from "~/routes/api/stripe-webhook"

function createDeps(): StripeWebhookDeps {
  return {
    getUserByEmail: vi.fn(),
    userUpdate: vi.fn().mockResolvedValue({}),
    userUpdateMany: vi.fn().mockResolvedValue({ count: 0 }),
  }
}

describe("handleStripeWebhookEvent", () => {
  let deps: StripeWebhookDeps

  beforeEach(() => {
    deps = createDeps()
  })

  describe("checkout.session.completed", () => {
    it("updates user when user exists for email", async () => {
      const event: Stripe.Event = {
        id: "evt_1",
        object: "event",
        api_version: "2024-11-20.acacia",
        created: Math.floor(Date.now() / 1000),
        type: "checkout.session.completed",
        data: {
          object: {
            customer_details: { email: "paying@example.com" },
            subscription: "sub_123",
          } as unknown as Stripe.Checkout.Session,
        },
      }
      vi.mocked(deps.getUserByEmail).mockResolvedValue({
        id: "user-1",
        email: "paying@example.com",
      })

      await handleStripeWebhookEvent(event, deps)

      expect(deps.getUserByEmail).toHaveBeenCalledWith("paying@example.com")
      expect(deps.userUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          subscriptionStatus: "paid",
          subscriptionId: "sub_123",
          subscriptionStartDate: expect.any(Date),
        },
      })
    })

    it("does not update when no user for email", async () => {
      const event: Stripe.Event = {
        id: "evt_2",
        object: "event",
        api_version: "2024-11-20.acacia",
        created: Math.floor(Date.now() / 1000),
        type: "checkout.session.completed",
        data: {
          object: {
            customer_details: { email: "nobody@example.com" },
            subscription: "sub_456",
          } as unknown as Stripe.Checkout.Session,
        },
      }
      vi.mocked(deps.getUserByEmail).mockResolvedValue(null)

      await handleStripeWebhookEvent(event, deps)

      expect(deps.userUpdate).not.toHaveBeenCalled()
    })
  })

  describe("customer.subscription.updated", () => {
    it("sets paid when status is active", async () => {
      const event: Stripe.Event = {
        id: "evt_3",
        object: "event",
        api_version: "2024-11-20.acacia",
        created: Math.floor(Date.now() / 1000),
        type: "customer.subscription.updated",
        data: {
          object: { id: "sub_789", status: "active" } as unknown as Stripe.Subscription,
        },
      }

      await handleStripeWebhookEvent(event, deps)

      expect(deps.userUpdateMany).toHaveBeenCalledWith({
        where: { subscriptionId: "sub_789" },
        data: { subscriptionStatus: "paid" },
      })
    })

    it("sets cancelled when status is not active/past_due", async () => {
      const event: Stripe.Event = {
        id: "evt_4",
        object: "event",
        api_version: "2024-11-20.acacia",
        created: Math.floor(Date.now() / 1000),
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_cancel",
            status: "canceled",
          } as unknown as Stripe.Subscription,
        },
      }

      await handleStripeWebhookEvent(event, deps)

      expect(deps.userUpdateMany).toHaveBeenCalledWith({
        where: { subscriptionId: "sub_cancel" },
        data: {
          subscriptionStatus: "cancelled",
          subscriptionStartDate: null,
        },
      })
    })
  })

  describe("customer.subscription.deleted", () => {
    it("clears subscription and sets cancelled", async () => {
      const event: Stripe.Event = {
        id: "evt_5",
        object: "event",
        api_version: "2024-11-20.acacia",
        created: Math.floor(Date.now() / 1000),
        type: "customer.subscription.deleted",
        data: {
          object: { id: "sub_deleted" } as unknown as Stripe.Subscription,
        },
      }

      await handleStripeWebhookEvent(event, deps)

      expect(deps.userUpdateMany).toHaveBeenCalledWith({
        where: { subscriptionId: "sub_deleted" },
        data: {
          subscriptionStatus: "cancelled",
          subscriptionId: null,
          subscriptionStartDate: null,
        },
      })
    })
  })

  describe("unhandled event type", () => {
    it("does not call userUpdate or userUpdateMany", async () => {
      const event: Stripe.Event = {
        id: "evt_6",
        object: "event",
        api_version: "2024-11-20.acacia",
        created: Math.floor(Date.now() / 1000),
        type: "invoice.paid",
        data: { object: {} },
      }

      await handleStripeWebhookEvent(event, deps)

      expect(deps.userUpdate).not.toHaveBeenCalled()
      expect(deps.userUpdateMany).not.toHaveBeenCalled()
    })
  })
})
