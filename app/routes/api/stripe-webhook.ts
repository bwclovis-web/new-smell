import { SubscriptionStatus } from "@prisma/client"
import type Stripe from "stripe"
import { type ActionFunctionArgs } from "react-router"

import { prisma } from "~/db.server"
import { getUserByEmail } from "~/models/user.query"
import { verifyWebhookPayload } from "~/utils/server/stripe.server"

/**
 * Stripe webhook handler. Only POST. Verifies signature, handles subscription
 * events, returns 200 quickly. Configure Stripe to send events to this URL
 * (e.g. https://yourdomain.com/api/stripe-webhook).
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  const signature = request.headers.get("Stripe-Signature")
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return new Response("Invalid body", { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = verifyWebhookPayload(rawBody, signature)
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err)
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : "Invalid signature"}`, {
      status: 400,
    })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const email =
          (session.customer_details?.email as string | undefined) ||
          (session.customer_email as string | undefined)
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id

        if (email && subscriptionId) {
          const user = await getUserByEmail(email)
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionStatus: SubscriptionStatus.paid,
                subscriptionId,
                subscriptionStartDate: new Date(),
              },
            })
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const isActive =
          subscription.status === "active" || subscription.status === "past_due"
        const status = isActive ? SubscriptionStatus.paid : SubscriptionStatus.cancelled
        await prisma.user.updateMany({
          where: { subscriptionId: subscription.id },
          data: {
            subscriptionStatus: status,
            ...(status === SubscriptionStatus.cancelled && {
              subscriptionStartDate: null,
            }),
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await prisma.user.updateMany({
          where: { subscriptionId: subscription.id },
          data: {
            subscriptionStatus: SubscriptionStatus.cancelled,
            subscriptionId: null,
            subscriptionStartDate: null,
          },
        })
        break
      }

      default:
        // Unhandled event type - still return 200 so Stripe doesn't retry
        break
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err)
    return new Response("Webhook handler failed", { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
