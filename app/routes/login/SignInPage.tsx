import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useRef } from 'react'
import { Form, useActionData } from 'react-router'

import Input from '~/components/Atoms/Input/Input'
// import { login } from '~/models/session.server'
import { signInCustomer } from '~/models/user.server'
import { UserLogInSchema } from '~/utils/formValidationSchemas'

import { ROUTE_PATH as ADMIN_PATH } from '../admin/profilePage'
export const ROUTE_PATH = '/sign-in'
import { useTranslation } from 'react-i18next'
import type { ActionFunctionArgs } from 'react-router-dom'

import { login } from '~/models/session.server'

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const existingUser = await signInCustomer(formData)
  if (!existingUser) {
    return { error: 'Invalid email or password' }
  }

  await login({ context, userId: existingUser.id, redirectTo: ADMIN_PATH })
  return { success: true }
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
    <section className="flex flex-col items-center bg-noir-light/40 backdrop-blur-sm rounded-md shadow-md p-4 w-full max-w-md mx-auto border border-noir-dark shadow-noir-dark">
      <Form {...getFormProps(signInForm)} method="POST" className="max-w-md mx-auto p-4 rounded w-full flex flex-col gap-4">
        <Input inputId={t('forms.email')} inputType="email" action={email} inputRef={inputRef} />
        <Input inputId={t('forms.password')} inputType="password" action={password} inputRef={inputRef} />
        {actionData?.error && (
          <p className="text-red-600 mb-2">{actionData.error}</p>
        )}
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded mt-8">{t('forms.submit')}</button>
      </Form>
    </section>
  )
}
export default LogInPage
