/* eslint-disable max-statements */
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useRef, useState } from 'react'
import { type ActionFunctionArgs, Form, useActionData, useLoaderData } from 'react-router'

import { Button } from '~/components/Atoms/Button/Button'
import Input from '~/components/Atoms/Input/Input'
import Select from '~/components/Atoms/Select/Select'
import TagSearch from '~/components/Organisms/TagSearch/TagSearch'
import { getAllHouses } from '~/models/house.server'
import { createPerfume } from '~/models/perfume.server'
import { getAllTags } from '~/models/tags.server'
import { CreatePerfumeSchema } from '~/utils/formValidationSchemas'

export const ROUTE_PATH = '/admin/create-perfume' as const

export const action = async ({ request }: ActionFunctionArgs) => {
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  const test = parseWithZod(formData, { schema: CreatePerfumeSchema })
  if (test.status !== 'success') {
    return (test.reply())
  }
  const res = createPerfume(formData)
  return res
}

export const loader = async () => {
  const allHouses = await getAllHouses()
  const allNotes = await getAllTags()
  return { allHouses, allNotes }
}

const CreatePerfumePage = () => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { allHouses } = useLoaderData<typeof loader>()
  const lastResult = useActionData<SubmissionResult<string[]> | null>()
  const [topNotes, setTopNotes] = useState<any[]>([])
  const [heartNotes, setHeartNotes] = useState<any[]>([])
  const [baseNotes, setBaseNotes] = useState<any[]>([])

  const [createPerfumeForm, { name, description, image }] = useForm({
    lastResult: lastResult ?? null,
    constraint: getZodConstraint(CreatePerfumeSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: CreatePerfumeSchema })
    }
  })

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Create Perfume</h1>
        <p className="text-lg">Create a new perfume</p>
      </header>
      <Form method="POST" {...getFormProps(createPerfumeForm)} className="p-4 rounded-md noir-outline flex flex-col gap-3">
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
        <Select selectData={allHouses} selectId="house" label="Perfume House" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TagSearch
            name="notesTop"
            label="Top Notes"
            onChange={setTopNotes}
          />

          <TagSearch
            name="notesHeart"
            label="Heart Notes"
            onChange={setHeartNotes}
          />

          <TagSearch
            name="notesBase"
            label="Base Notes"
            onChange={setBaseNotes}
          />
        </div>
        {topNotes.map(tag => (
          <input key={tag.id} type="hidden" name="notesTop" value={tag.id} />
        ))}
        {heartNotes.map(tag => (
          <input key={tag.id} type="hidden" name="notesHeart" value={tag.id} />
        ))}
        {baseNotes.map(tag => (
          <input key={tag.id} type="hidden" name="notesBase" value={tag.id} />
        ))}
        <Button type="submit" className="max-w-max">
          Create Perfume
        </Button>
      </Form>
    </section>
  )
}

export default CreatePerfumePage
