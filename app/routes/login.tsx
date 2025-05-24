import bcrypt from 'bcryptjs'
import { redirect, useActionData } from 'react-router'

import { prisma } from '~/db.server' // your prisma instance

export const action = async ({ request, context }) => {
  console.log('Register action called', context)
  console.log('Register action called', request)
  const formData = await request.formData()
  const username = formData.get('username')
  const password = formData.get('password')

  if (
    typeof username !== 'string' || username.length < 3
    || typeof password !== 'string' || password.length < 6
  ) {
    return { error: 'Username must be at least 3 chars and password at least 6 chars' }
  }

  // Check if username already exists
  // const existingUser = await prisma.user.findUnique({ where: { username } })
  // if (existingUser) {
  //   return { error: 'Username already taken' }
  // }

  // // Hash password securely
  // const hashedPassword = await bcrypt.hash(password, 10)

  // // Create user record
  // const user = await prisma.user.create({
  //   data: {
  //     username,
  //     passwordHash: hashedPassword
  //   }
  // })

  // // Set session userId on successful register
  // context.req.session.userId = user.id
  // await context.req.session.save()

  // // Redirect to protected page or dashboard
  // return redirect('/admin')
}

export default function Register() {
  const actionData = useActionData()

  return (
    <form method="post" className="max-w-md mx-auto p-4 border rounded">
      <h1 className="text-2xl mb-4">Create Account</h1>

      <label className="block mb-2">
        Username
        <input type="text" name="username" required minLength={3} className="block w-full p-2 border" />
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
  )
}
