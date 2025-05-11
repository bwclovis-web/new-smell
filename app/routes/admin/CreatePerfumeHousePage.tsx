import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useRef } from 'react'
import { type ActionFunctionArgs, Form } from 'react-router'

import { Button } from '~/components/Atoms/Button/Button'
import Input from '~/components/Atoms/Input/Input'
import { createPerfumeHouse } from '~/models/house.server'
import { CreatePerfumeHouseSchema } from '~/utils/formValidationSchemas'

export const ROUTE_PATH = '/admin/create-perfume-house' as const

export const action = async ({ request }: ActionFunctionArgs) => {
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  createPerfumeHouse(formData)
}

const CreatePerfumeHousePage = () => {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [
    createHouseForm,
    { name, description, image, website, country, founded }
  ] = useForm({
    constraint: getZodConstraint(CreatePerfumeHouseSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: CreatePerfumeHouseSchema })
    }
  })

  return (
    <div>
      <h1>Create Perfume House</h1>
      <Form method="POST" {...getFormProps(createHouseForm)}>
        <Input
          inputType="text"
          inputRef={inputRef}
          action={name}
        />
        <Input
          inputType="text"
          inputRef={inputRef}
          action={description}
        />
        <Input
          inputType="text"
          inputRef={inputRef}
          action={image}
        />
        <Input
          inputType="text"
          inputRef={inputRef}
          action={website}
        />
        <Input
          inputType="text"
          inputRef={inputRef}
          action={country}
        />
        <Input
          inputType="text"
          inputRef={inputRef}
          action={founded}
        />
        <Button type="submit" className="mt-4">
          Create Perfume House
        </Button>
      </Form>
    </div>
  )
}

export default CreatePerfumeHousePage
