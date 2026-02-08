import { useTranslation } from "react-i18next"
import { Form, useActionData, useLoaderData } from "react-router"
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import { CSRFToken } from "~/components/Molecules/CSRFToken"
import TitleBanner from "~/components/Organisms/TitleBanner"
import { createCheckoutSession } from "~/utils/server/stripe.server"

import banner from "~/images/vault.webp"

export const ROUTE_PATH = "/subscribe"

const DEFAULT_REDIRECT = "/sign-up"

export const meta: MetaFunction = () => {
  return [
    { title: "Subscribe - Shadow and Sillage" },
    {
      name: "description",
      content:
        "Subscribe to join Shadow and Sillage. Payment is required to sign up once our early adopter limit has been reached.",
    },
  ]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const redirect = url.searchParams.get("redirect") ?? DEFAULT_REDIRECT
  // Normalize: ensure leading slash, avoid open redirect (same-origin path only)
  const safeRedirect = redirect.startsWith("/") ? redirect : `/${redirect}`
  return { redirect: safeRedirect }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  const formData = await request.formData()
  const { requireCSRF } = await import("~/utils/server/csrf.server")
  await requireCSRF(request, formData)

  const redirectPath = (formData.get("redirect") as string) || DEFAULT_REDIRECT
  const safeRedirect = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`

  const origin = new URL(request.url).origin
  const successUrl = `${origin}/subscribe-success?session_id={CHECKOUT_SESSION_ID}&redirect=${encodeURIComponent(safeRedirect)}`
  const cancelUrl = `${origin}/subscribe?redirect=${encodeURIComponent(safeRedirect)}`

  try {
    const session = await createCheckoutSession({
      successUrl,
      cancelUrl,
      metadata: { redirect: safeRedirect },
    })

    if (session.url) {
      return Response.redirect(session.url, 303)
    }
  } catch (err) {
    console.error("Stripe checkout session error:", err)
    return {
      error:
        err instanceof Error ? err.message : "Unable to start checkout. Please try again.",
      redirect: safeRedirect,
    }
  }

  return {
    error: "Unable to start checkout. Please try again.",
    redirect: safeRedirect,
  }
}

const SubscribePage = () => {
  const { t } = useTranslation()
  const { redirect } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t("subscribe.heading")}
        subheading={t("subscribe.subheading")}
      />

      <article className="inner-container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg prose-invert max-w-none">
            <h2 className="text-noir-gold text-2xl font-bold mb-6">
              {t("subscribe.limitTitle")}
            </h2>
            <div className="flex flex-col gap-6 text-noir-light leading-relaxed text-lg">
              <p>{t("subscribe.limitCopy")}</p>
              <p>{t("subscribe.paymentRequired")}</p>
            </div>

            {actionData?.error && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-700 dark:text-red-300">
                {actionData.error}
              </div>
            )}

            <div className="mt-10 p-6 noir-border bg-noir-dark/30 rounded-lg">
              <Form method="POST" className="flex flex-col gap-4">
                <CSRFToken />
                <input type="hidden" name="redirect" value={redirect} />
                <Button type="submit" variant="icon" background="gold" size="xl">
                  {t("subscribe.cta")}
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}

export default SubscribePage
