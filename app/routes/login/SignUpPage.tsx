import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useRef } from 'react'
import { Form, useActionData } from 'react-router'

import Input from '~/components/Atoms/Input/Input'
import { login } from '~/models/session.server'
import { createUser, getUserByName } from '~/models/user.server'
import { UserFormSchema } from '~/utils/formValidationSchemas'

export const ROUTE_PATH = '/sign-up'

import type { ActionFunctionArgs } from 'react-router-dom'

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData()

  console.log('Form context:', context)

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

  const [signupForm, { email, password, confirmPassword }] = useForm({
    constraint: getZodConstraint(UserFormSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: UserFormSchema })
    }
  })

  return (
    <section className="flex flex-col items-center bg-noir-light/20 backdrop-blur-sm rounded-md shadow-md p-4 w-full max-w-md mx-auto">
      <Form {...getFormProps(signupForm)} method="POST" className="max-w-md mx-auto p-4 rounded w-full">
        <Input inputId="email" inputType="email" action={email} inputRef={inputRef} />
        <Input inputId="password" inputType="password" action={password} inputRef={inputRef} />
        <Input inputId="passwordMatch" inputType="password" action={confirmPassword} inputRef={inputRef} />
        {actionData?.error && (
          <p className="text-red-600 mb-2">{actionData.error}</p>
        )}
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded mt-8">Register</button>
      </Form>
    </section>
  )
}

export default RegisterPage
