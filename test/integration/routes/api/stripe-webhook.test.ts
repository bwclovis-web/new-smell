/**
 * Stripe webhook route integration tests (Phase 8.1).
 *
 * - Verify signature: reject missing header (401), invalid signature (400), non-POST (405).
 * - Event handling with test payloads: see stripe-webhook-event-handler.test.ts.
 *
 * @group integration
 * @group api
 * @group stripe
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import * as stripeServer from "~/utils/server/stripe.server"
import { action as stripeWebhookAction } from "~/routes/api/stripe-webhook"

vi.mock("~/utils/server/stripe.server")

describe("Stripe webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("request validation", () => {
    it("returns 405 for non-POST method", async () => {
      const request = new Request("https://example.com/api/stripe-webhook", {
        method: "GET",
      })
      const res = await stripeWebhookAction({ request, params: {}, context: {} })
      expect(res.status).toBe(405)
      expect(stripeServer.verifyWebhookPayload).not.toHaveBeenCalled()
    })

    it("returns 401 when Stripe-Signature header is missing", async () => {
      const request = new Request("https://example.com/api/stripe-webhook", {
        method: "POST",
        body: "{}",
        headers: {},
      })
      const res = await stripeWebhookAction({ request, params: {}, context: {} })
      expect(res.status).toBe(401)
      expect(await res.text()).toBe("Missing Stripe-Signature header")
      expect(stripeServer.verifyWebhookPayload).not.toHaveBeenCalled()
    })

    it("returns 400 when signature verification fails", async () => {
      vi.mocked(stripeServer.verifyWebhookPayload).mockImplementation(() => {
        throw new Error("Invalid signature")
      })
      const request = new Request("https://example.com/api/stripe-webhook", {
        method: "POST",
        body: "{}",
        headers: { "Stripe-Signature": "t=1,v1=bad" },
      })
      const res = await stripeWebhookAction({ request, params: {}, context: {} })
      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Invalid webhook signature")
    })
  })
})
