import { redirect, useActionData } from 'react-router'

import { createUser, getUserByName } from '~/models/user.server'

// eslint-disable-next-line max-statements
export const action = async ({ request, context }) => {
  const formData = await request.formData()
  const email = formData.get('email')
  const password = formData.get('password')

  if (
    typeof email !== 'string' || email.length < 3
    || typeof password !== 'string' || password.length < 6
  ) {
    return { error: 'Username must be at least 3 chars and password at least 6 chars' }
  }

  const existingUser = await getUserByName(email)
  if (existingUser) {
    return { error: 'Username already taken' }
  }
  const user = await createUser(formData)

  // // Set session userId on successful register
  context.req.session.userId = user.id
  await context.req.session.save()

  // // Redirect to protected page or dashboard
  // return redirect('/admin')
}

export default function Register() {
  const actionData = useActionData()

  return (
    <section className="flex flex-col items-center bg-noir-light/20 backdrop-blur-sm rounded-md shadow-md p-4 w-full max-w-md mx-auto">

      {/* <div className="w-full max-w-md">
        <RegisterForm actionData={actionData} />
      </div> */}
      <form method="post" className="max-w-md mx-auto p-4 rounded w-full">
        <label className="block mb-2">
          Username
          <input type="email" name="email" required minLength={3} className="block w-full p-2 border" />
        </label>

        <label className="block mb-2">
          Password
          <input type="password" name="password" required minLength={6} className="block w-full p-2 border" />
        </label>

        {actionData?.error && (
          <p className="text-red-600 mb-2">{actionData.error}</p>
        )}

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Register</button>
      </form>
    </section>

  )
}
