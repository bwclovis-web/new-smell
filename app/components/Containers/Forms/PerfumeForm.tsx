/* eslint-disable complexity */
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useEffect, useRef, useState } from 'react'
import { Form } from 'react-router'

import { Button } from '~/components/Atoms/Button/Button'
import Input from '~/components/Atoms/Input/Input'
import Select from '~/components/Atoms/Select/Select'
import TagSearch from '~/components/Organisms/TagSearch/TagSearch'
import type { FORM_TYPES } from '~/utils/constants'
import { CreatePerfumeSchema } from '~/utils/formValidationSchemas'

import type { SafeUserPerfume, PerfumeHouse } from '~/types'

interface PerfumeFormProps {
  formType: typeof FORM_TYPES[keyof typeof FORM_TYPES]
  lastResult: unknown
  data?: SafeUserPerfume
  allHouses: PerfumeHouse[]
}
const PerfumeForm
  = ({ formType, lastResult, data, allHouses }: PerfumeFormProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [topNotes, setTopNotes] = useState<string[]>([])
    const [heartNotes, setHeartNotes] = useState<string[]>([])
    const [baseNotes, setBaseNotes] = useState<string[]>([])
    const [serverError, setServerError] = useState<string | null>(null)
    useEffect(() => {
      if (lastResult && !lastResult.success) {
        setServerError(lastResult.error as unknown as string)
      }
    }, [lastResult])

    const [form, { name, description, image }] = useForm({
      id: formType,
      lastResult: lastResult && lastResult.success ? lastResult : null,
      constraint: getZodConstraint(CreatePerfumeSchema),
      onValidate({ formData }) {
        return parseWithZod(formData, { schema: CreatePerfumeSchema })
      }
    })

    const formatSelectData = (allHouses: any[]) => allHouses.map(house => ({
      id: house.id,
      name: house.name,
      label: house.name,
    }))

    return (
      <Form method="POST" {...getFormProps(form)} className="p-6 rounded-md noir-border max-w-6xl mx-auto bg-noir-dark/10 flex flex-col gap-3">
        <Input
          inputType="text"
          inputRef={inputRef}
          action={name}
          shading={true}
          defaultValue={data?.name}
        />
        <Input
          inputType="text"
          inputRef={inputRef}
          action={description}
          inputId="description"
          shading={true}
          defaultValue={data?.description}
        />
        <Input
          shading={true}
          inputType="text"
          inputRef={inputRef}
          action={image}
          inputId="image"
          defaultValue={data?.image}
        />
        <Select selectData={formatSelectData(allHouses)} selectId="house" label="Perfume House" defaultId={data?.perfumeHouseId} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <TagSearch
            name="notesTop"
            label="Top Notes"
            onChange={setTopNotes as any}
            data={data?.perfumeNotesOpen}
          />

          <TagSearch
            name="notesHeart"
            label="Heart Notes"
            onChange={setHeartNotes as any}
            data={data?.perfumeNotesHeart}
          />

          <TagSearch
            name="notesBase"
            label="Base Notes"
            onChange={setBaseNotes as any}
            data={data?.perfumeNotesClose}
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
        {serverError && (
          <div className="bg-red-500 text-lg font-semibold px-3 py-2 max-w-max rounded-2xl border-2 text-white">
            {serverError}
          </div>
        )}
        <input type="hidden" name="perfumeId" value={data?.id} />
        <Button type="submit" className="max-w-max">
          Create Perfume
        </Button>
      </Form>
    )
  }

export default PerfumeForm
