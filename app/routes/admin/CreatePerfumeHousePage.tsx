import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useRef } from 'react'
import { type ActionFunctionArgs, Form, useActionData } from 'react-router'

import { Button } from '~/components/Atoms/Button/Button'
import Input from '~/components/Atoms/Input/Input'
import { createPerfumeHouse } from '~/models/house.server'
import { CreatePerfumeHouseSchema } from '~/utils/formValidationSchemas'

export const ROUTE_PATH = '/admin/create-perfume-house' as const

export const action = async ({ request }: ActionFunctionArgs) => {
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  const test = parseWithZod(formData, { schema: CreatePerfumeHouseSchema })
  if (test.status !== 'success') {
    return (test.reply())
  }
  const res = await createPerfumeHouse(formData)
  return res
}

const CreatePerfumeHousePage = () => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const lastResult = useActionData<SubmissionResult<string[]> | null>()

  const [
    createHouseForm,
    { name, description, image, website, country, founded }
  ] = useForm({
    lastResult: lastResult ?? null,
    constraint: getZodConstraint(CreatePerfumeHouseSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: CreatePerfumeHouseSchema })
    }
  })

  return (
    <div>
      <h1 className="mb-6">Create Perfume House</h1>
      <Form method="POST" {...getFormProps(createHouseForm)} autoComplete="off" className="bg-noir-gold/10 p-4 rounded-md noir-outline flex flex-col gap-3">
        <Input
          inputType="text"
          inputRef={inputRef}
          action={name}
          inputId="name"
        />
        <Input
          inputType="text"
          inputRef={inputRef}
          action={description}
          inputId="description"
        />
        <Input
          inputType="text"
          inputRef={inputRef}
          action={image}
          inputId="image"
        />
        <Input
          inputType="text"
          inputRef={inputRef}
          action={website}
          inputId="website"
        />
        <Input
          inputType="text"
          inputRef={inputRef}
          action={country}
          inputId="country"
        />
        <Input
          inputType="text"
          inputRef={inputRef}
          action={founded}
          inputId="founded"
        />
        <Button type="submit" className="mt-4 max-w-max">
          Create Perfume House
        </Button>
      </Form>
    </div>
  )
}

export default CreatePerfumeHousePage
