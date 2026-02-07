import { getFormProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import type { ActionFunctionArgs } from "react-router"
import { Form, useActionData } from "react-router"

import { Button } from "~/components/Atoms/Button"
import Input from "~/components/Atoms/Input"
import ErrorDisplay from "~/components/Containers/ErrorDisplay"
import { CSRFToken } from "~/components/Molecules/CSRFToken"
import { login } from "~/models/session.server"
import { signInCustomer } from "~/models/user.server"
import { ROUTE_PATH as ADMIN_PATH } from "~/routes/admin/profilePage"
import { AuthErrorHandler } from "~/utils/errorHandling.server"
import { UserLogInSchema } from "~/utils/formValidationSchemas"

export const ROUTE_PATH = "/sign-in"

export const action = async ({ request, context }: ActionFunctionArgs) => {
  let formData: FormData
  try {
    formData = await request.formData()
    const { requireCSRF } = await import("~/utils/server/csrf.server")
    await requireCSRF(request, formData)

    const existingUser = await signInCustomer(formData)
    if (!existingUser) {
      return { error: "Invalid email or password" }
    }

    await login({
      context: {} as any,
      userId: existingUser.id,
      redirectTo: ADMIN_PATH,
    })
    return { success: true }
  } catch (error) {
    // Re-throw redirects (302 or 303 status codes)
    if (
      error instanceof Response &&
      (error.status === 302 || error.status === 303)
    ) {
      throw error
    }

    // Use centralized error handling
    const appError = AuthErrorHandler.handle(error, {
      formData: formData ? Object.fromEntries(formData) : {},
      action: "signIn",
    })

    return { error: appError.userMessage }
  }
}
const LogInPage = () => {
  const actionData = useActionData()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { t } = useTranslation()
  const [signInForm, { email, password }] = useForm({
    constraint: getZodConstraint(UserLogInSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: UserLogInSchema })
    },
  })

  return (
    <section className="flex flex-col p-1 md:px-4 w-full mx-auto ">
      <Form
        {...getFormProps(signInForm)}
        method="POST"
        className="max-w-md mx-auto p-1 md:p-4 relative w-full flex flex-col gap-4 noir-border"
      >
        <CSRFToken />
        <Input
          shading={true}
          inputId="email"
          label={t("forms.emailLabel")}
          inputType="email"
          action={email}
          inputRef={inputRef}
        />
        <Input
          shading={true}
          inputId="password"
          label={t("forms.passwordLabel")}
          inputType="password"
          action={password}
          inputRef={inputRef}
        />
        {actionData?.error && (
          <ErrorDisplay
            error={actionData.error}
            variant="inline"
            title="Sign-in Error"
          />
        )}
        <Button type="submit" variant={"icon"} background={"gold"} size={"xl"}>
          {t("forms.submit")}
        </Button>
      </Form>
    </section>
  )
}
export default LogInPage
