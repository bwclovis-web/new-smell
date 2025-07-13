import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useRef } from 'react'
import { Form, useActionData } from 'react-router'

import Input from '~/components/Atoms/Input/Input'
import { login } from '~/models/session.server'
import { createUser, getUserByName } from '~/models/user.server'
import { UserFormSchema } from '~/utils/formValidationSchemas'

export const ROUTE_PATH = '/sign-up'

import { useTranslation } from 'react-i18next'
import type { ActionFunctionArgs } from 'react-router-dom'

import { Button } from '~/components/Atoms/Button/Button'

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const existingUser = await getUserByName(formData.get('email') as string)
  if (existingUser) {
    return { error: 'Username already taken' }
  }
  const user = await createUser(formData)
  await login({ context, userId: user.id })
}

const RegisterPage = () => {
  const actionData = useActionData()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { t } = useTranslation()
  const [signupForm, { email, password, confirmPassword }] = useForm({
    constraint: getZodConstraint(UserFormSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: UserFormSchema })
    }
  })

  return (
    <section className="flex flex-col items-center px-4 w-full max-w-md mx-auto ">
      <Form {...getFormProps(signupForm)} method="POST" className="max-w-md mx-auto p-4 relative w-full flex flex-col gap-4 noir-border">
        <Input shading={true} inputId={t('forms.email')} inputType="email" action={email} inputRef={inputRef} />
        <Input shading={true} inputId={t('forms.password')} inputType="password" action={password} inputRef={inputRef} />
        <Input shading={true} inputId={t('forms.passwordMatch')} inputType="password" action={confirmPassword} inputRef={inputRef} />
        {actionData?.error && (
          <p className="text-red-600 mb-2">{actionData.error}</p>
        )}
        <Button type="submit" variant={'icon'} background={'gold'} size={'xl'}>{t('forms.submit')}</Button>
      </Form>
    </section>
  )
}

export default RegisterPage
