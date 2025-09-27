import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, useActionData, useLoaderData } from 'react-router'
import type { ActionFunctionArgs } from 'react-router-dom'

import { Button } from '~/components/Atoms/Button/Button'
import Input from '~/components/Atoms/Input/Input'
import { CSRFToken } from '~/components/Molecules/CSRFToken'
import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
import type { SafeUser } from '~/types'
import { UpdateProfileSchema } from '~/utils/formValidationSchemas'
import { sharedLoader } from '~/utils/sharedLoader'
import { getUserDisplayName } from '~/utils/user'

import banner from '../../images/profile.webp'
import { getUserByUsername, updateUser } from './profile/queries.server'

export const ROUTE_PATH = '/admin/profile'

type ActionData =
  | { success: true }
  | { errors: Record<string, string[] | null> }

export const loader = async ({ request }: { request: Request }) => {
  const user = await sharedLoader(request)
  return { user }
}

const validateProfileUpdate = async (formData: FormData) => {
  const submission = parseWithZod(formData, { schema: UpdateProfileSchema })

  if (submission.status !== 'success') {
    return { errors: submission.error }
  }

  const { username } = submission.value
  const userId = formData.get('userId') as string

  // Check if username is already taken by another user
  const existingUser = await getUserByUsername(username)
  if (existingUser && existingUser.id !== userId) {
    return {
      errors: {
        username: ['Username is already taken']
      }
    }
  }

  return { submission }
}

export const action = async ({
  request
}: ActionFunctionArgs): Promise<ActionData> => {
  const formData = await request.formData()

  const validation = await validateProfileUpdate(formData)
  if (validation.errors) {
    return { errors: validation.errors }
  }

  const { firstName, lastName, username, email } = validation.submission!.value
  const userId = formData.get('userId') as string

  try {
    await updateUser(userId, { firstName, lastName, username, email })
    return { success: true }
  } catch {
    return {
      errors: {
        general: ['Failed to update profile. Please try again.']
      }
    }
  }
}

const ProfileForm = ({ user }: { user: SafeUser }) => {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [profileForm, { firstName, lastName, username, email }] = useForm({
    constraint: getZodConstraint(UpdateProfileSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: UpdateProfileSchema })
    },
    defaultValue: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.email || '',
    }
  })

  return (
    <Form
      {...getFormProps(profileForm)}
      method="POST"
      className="space-y-4 noir-border p-6"
    >
      <CSRFToken />
      <input type="hidden" name="userId" value={user.id} />

      <Input
        shading={true}
        inputId="firstName"
        inputType="text"
        label="First Name"
        action={firstName}
        inputRef={inputRef}
      />

      <Input
        shading={true}
        inputId="lastName"
        inputType="text"
        label="Last Name"
        action={lastName}
        inputRef={inputRef}
      />

      <Input
        shading={true}
        inputId="username"
        inputType="text"
        label="Username"
        action={username}
        inputRef={inputRef}
      />

      <Input
        shading={true}
        inputId="email"
        inputType="email"
        label="Email"
        action={email}
        inputRef={inputRef}
      />

      <Button
        type="submit"
        variant={'primary'}
        background={'gold'}
        size={'xl'}
        className="w-full"
      >
        Update Profile
      </Button>
    </Form>
  )
}

const ProfilePage = () => {
  const { t } = useTranslation()
  const { user } = useLoaderData<typeof loader>()
  const actionData = useActionData<ActionData>()

  if (!user) {
    return <div>{t('profile.heading', 'Welcome, Guest!')}</div>
  }

  const hasSuccess = actionData && 'success' in actionData
  const hasErrors = actionData && 'errors' in actionData

  return (
    <div className="">
      <TitleBanner
        image={banner}
        heading={t('profile.heading')}
        subheading={` ${t('profile.subheading')}`}
      >
        <span className='block max-w-max rounded-md font-semibold text-noir-gold-500 mx-auto'>
          {getUserDisplayName(user)}
        </span>
      </TitleBanner>

      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-noir-gold">Update Profile</h2>
        {hasSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Profile updated successfully!
          </div>
        )}
        {hasErrors && actionData.errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {actionData.errors.general[0]}
          </div>
        )}
        <ProfileForm user={user} />
      </div>
    </div>
  )
}

export default ProfilePage
