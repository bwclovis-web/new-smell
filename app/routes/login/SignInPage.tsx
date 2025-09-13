import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useRef } from 'react'
import { Form, useActionData } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { ActionFunctionArgs } from 'react-router-dom'

import Input from '~/components/Atoms/Input/Input'
import { Button } from '~/components/Atoms/Button/Button'
import { signInCustomer } from '~/models/user.server'
import { login } from '~/models/session.server'
import { UserLogInSchema } from '~/utils/formValidationSchemas'
import { ROUTE_PATH as ADMIN_PATH } from '~/routes/admin/profilePage'

export const ROUTE_PATH = '/sign-in'

export const action = async ({ request, context }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData()

    const existingUser = await signInCustomer(formData)
    if (!existingUser) {
      return { error: 'Invalid email or password' }
    }

    await login({ context, userId: existingUser.id, redirectTo: ADMIN_PATH })
    return { success: true }
  } catch (error) {
    // Check if this is a redirect (which is expected behavior)
    if (error instanceof Response && error.status === 302) {
      // This is a redirect, not an error - let it through
      throw error
    }

    console.error('Sign-in error:', error)

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('JWT_SECRET')) {
        return { error: 'Server configuration error. Please contact support.' }
      }
      if (error.message.includes('DATABASE_URL')) {
        return { error: 'Database connection error. Please try again later.' }
      }
      if (error.message.includes('SESSION_SECRET')) {
        return { error: 'Server configuration error. Please contact support.' }
      }
    }

    // Generic error for production
    return { error: 'An unexpected error occurred. Please try again.' }
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
    }
  })

  return (
    <section className="flex flex-col p-1 md:px-4 w-full mx-auto ">
      <Form {...getFormProps(signInForm)} method="POST" className="max-w-md mx-auto p-1 md:p-4 relative w-full flex flex-col gap-4 noir-border">
        <Input shading={true} inputId={t('forms.email')} inputType="email" action={email} inputRef={inputRef} />
        <Input shading={true} inputId={t('forms.password')} inputType="password" action={password} inputRef={inputRef} />
        {actionData?.error && (
          <p className="text-red-600 mb-2">{actionData.error}</p>
        )}
        <Button type="submit" variant={'icon'} background={'gold'} size={'xl'}>{t('forms.submit')}</Button>
      </Form>
    </section>
  )
}
export default LogInPage
