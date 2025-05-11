import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useRef } from 'react'
import { type ActionFunctionArgs, Form, useLoaderData } from 'react-router'

import { Button } from '~/components/Atoms/Button/Button'
import Input from '~/components/Atoms/Input/Input'
import Select from '~/components/Atoms/Select/Select'
import { getAllHouses } from '~/models/house.server'
import { createPerfume } from '~/models/perfume.server'
import { getAllTags } from '~/models/tags.server'
import { CreatePerfumeSchema } from '~/utils/formValidationSchemas'

export const ROUTE_PATH = '/admin/create-perfume' as const

export const action = async ({ request }: ActionFunctionArgs) => {
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  createPerfume(formData)
}

export const loader = async () => {
  const allHouses = await getAllHouses()
  const allNotes = await getAllTags()
  return { allHouses, allNotes }
}

const CreatePerfumePage = () => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { allHouses, allNotes } = useLoaderData<typeof loader>()

  const [createPerfumeForm, { name, description, image }] = useForm({
    constraint: getZodConstraint(CreatePerfumeSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: CreatePerfumeSchema })
    }
  })

  return (
    <div>
      <h1 className="mb-6">Create Perfume</h1>
      <Form method="POST" {...getFormProps(createPerfumeForm)} className="bg-noir-gold/10 p-4 rounded-md noir-outline flex flex-col gap-3">
        <Input
          inputType="text"
          inputRef={inputRef}
          action={name}
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
        <Select selectData={allHouses} selectId="house" />
        <Select selectData={allNotes} selectId="notesOpen" />
        <Select selectData={allNotes} selectId="notesHeart" />
        <Select selectData={allNotes} selectId="notesClose" />
        <Button type="submit" className="max-w-max">
          Create Perfume
        </Button>
      </Form>
    </div>
  )
}

export default CreatePerfumePage
