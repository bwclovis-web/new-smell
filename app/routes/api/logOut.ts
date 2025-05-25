// app/routes/logout.tsx
import { type ActionFunctionArgs, redirect } from 'react-router'

import { logout } from '~/models/session.server'

export async function action({ context }: ActionFunctionArgs) {
  return logout({ context })
}
