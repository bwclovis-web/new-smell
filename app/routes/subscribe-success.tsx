import { useTranslation } from "react-i18next"
import { Link, useLoaderData } from "react-router"
import type { LoaderFunctionArgs, MetaFunction } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import TitleBanner from "~/components/Organisms/TitleBanner"
import { getCheckoutSession } from "~/utils/server/stripe.server"

import banner from "~/images/vault.webp"
import { ROUTE_PATH as SIGN_UP_PATH } from "~/routes/login/SignUpPage"

export const ROUTE_PATH = "/subscribe-success"

const DEFAULT_REDIRECT = "/sign-up"

export const meta: MetaFunction = () => {
  return [
    { title: "Payment successful - Shadow and Sillage" },
    {
      name: "description",
      content: "Your subscription payment was successful. Complete sign up to create your account.",
    },
  ]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get("session_id")
  const redirect = url.searchParams.get("redirect") ?? DEFAULT_REDIRECT
  const safeRedirect = redirect.startsWith("/") ? redirect : `/${redirect}`

  let customerEmail: string | null = null
  if (sessionId) {
    try {
      const session = await getCheckoutSession(sessionId)
      if (session) {
        customerEmail =
          (session.customer_details?.email as string | undefined) ||
          (session.customer_email as string | undefined) ||
          null
      }
    } catch {
      // Non-fatal: we still show success and link to signup
    }
  }

  const signUpUrl = sessionId
    ? `${SIGN_UP_PATH}?session_id=${encodeURIComponent(sessionId)}${customerEmail ? `&email=${encodeURIComponent(customerEmail)}` : ""}`
    : safeRedirect

  return { signUpUrl, sessionId, customerEmail }
}

const SubscribeSuccessPage = () => {
  const { t } = useTranslation()
  const { signUpUrl } = useLoaderData<typeof loader>()

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t("subscribeSuccess.heading")}
        subheading={t("subscribeSuccess.subheading")}
      />

      <article className="inner-container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg prose-invert max-w-none">
            <h2 className="text-noir-gold text-2xl font-bold mb-6">
              {t("subscribeSuccess.messageTitle")}
            </h2>
            <p className="text-noir-light leading-relaxed text-lg mb-8">
              {t("subscribeSuccess.messageBody")}
            </p>

            <div className="mt-10 p-6 noir-border bg-noir-dark/30 rounded-lg">
              <Link to={signUpUrl} className="block w-full">
                <Button
                  type="button"
                  variant="icon"
                  background="gold"
                  size="xl"
                  className="w-full"
                >
                  {t("subscribeSuccess.cta")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}

export default SubscribeSuccessPage
