import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useEffect, useRef, useState } from 'react'
import { Form } from 'react-router'

import { Button } from '~/components/Atoms/Button/Button'
import HouseTypeahead from '~/components/Atoms/HouseTypeahead/HouseTypeahead'
import Input from '~/components/Atoms/Input/Input'
import { CSRFToken } from '~/components/Molecules/CSRFToken'
import TagSearch from '~/components/Organisms/TagSearch/TagSearch'
import type { FORM_TYPES } from '~/utils/constants'
import { CreatePerfumeSchema } from '~/utils/formValidationSchemas'

// Type for perfume data used in the form
type PerfumeFormData = {
  id?: string
  name?: string
  description?: string | null
  image?: string | null
  perfumeHouseId?: string | null
  perfumeHouse?: {
    id: string
    name: string
  } | null
  perfumeNotesOpen?: Array<{ id: string; name: string }>
  perfumeNotesHeart?: Array<{ id: string; name: string }>
  perfumeNotesClose?: Array<{ id: string; name: string }>
}

interface PerfumeFormProps {
  formType: typeof FORM_TYPES[keyof typeof FORM_TYPES]
  lastResult: any
  data?: PerfumeFormData | null
}
/* eslint-disable complexity */
const PerfumeForm
  = ({ formType, lastResult, data }: PerfumeFormProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [topNotes, setTopNotes] = useState<any[]>([])
    const [heartNotes, setHeartNotes] = useState<any[]>([])
    const [baseNotes, setBaseNotes] = useState<any[]>([])
    const [serverError, setServerError] = useState<string | null>(null)
    useEffect(() => {
      if (lastResult && !lastResult.success) {
        setServerError(lastResult.error as unknown as string)
      }
    }, [lastResult])

    const [form, { name, description, image, house }] = useForm({
      id: formType,
      lastResult: lastResult && lastResult.success ? lastResult : null,
      constraint: getZodConstraint(CreatePerfumeSchema),
      onValidate({ formData }) {
        return parseWithZod(formData, { schema: CreatePerfumeSchema })
      }
    })

    return (
      <Form
        method="POST"
        {...getFormProps(form)}
        className="p-6 rounded-md noir-border max-w-6xl mx-auto bg-noir-dark/10 flex flex-col gap-3 h-[100000px]"
        onSubmit={evt => {
          const formData = new FormData(evt.currentTarget)
          // eslint-disable-next-line no-console
          console.log('Submitting form data:', Object.fromEntries(formData))
        }}
      >
        <Input
          inputType="text"
          inputRef={inputRef}
          action={name}
          shading={true}
          defaultValue={data?.name || ''}
        />
        <Input
          inputType="text"
          inputRef={inputRef}
          action={description}
          inputId="description"
          shading={true}
          defaultValue={data?.description || ''}
        />
        <Input
          shading={true}
          inputType="text"
          inputRef={inputRef}
          action={image}
          inputId="image"
          defaultValue={data?.image || ''}
        />
        <div>
          <HouseTypeahead
            name="house"
            label="Perfume House"
            defaultId={data?.perfumeHouseId || undefined}
            defaultName={data?.perfumeHouse?.name}
          />
          {house.errors && (
            <div className="text-red-400 text-sm mt-1">
              {house.errors}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <TagSearch
            name="notesTop"
            label="Top Notes"
            onChange={setTopNotes as any}
            data={data?.perfumeNotesOpen as any}
          />

          <TagSearch
            name="notesHeart"
            label="Heart Notes"
            onChange={setHeartNotes as any}
            data={data?.perfumeNotesHeart as any}
          />

          <TagSearch
            name="notesBase"
            label="Base Notes"
            onChange={setBaseNotes as any}
            data={data?.perfumeNotesClose as any}
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
        <CSRFToken />
        {serverError && (
          <div className="bg-red-500 text-lg font-semibold px-3 py-2 max-w-max rounded-2xl border-2 text-white">
            {serverError}
          </div>
        )}
        {data?.id && <input type="hidden" name="perfumeId" value={data.id} />}
        <Button type="submit" className="max-w-max">
          Create Perfume
        </Button>
      </Form>
    )
  }

export default PerfumeForm
