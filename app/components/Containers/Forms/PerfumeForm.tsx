import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useEffect, useRef, useState } from 'react'
import { Form, useSubmit } from 'react-router'

import { Button } from '~/components/Atoms/Button/Button'
import HouseTypeahead from '~/components/Atoms/HouseTypeahead/HouseTypeahead'
import Input from '~/components/Atoms/Input/Input'
import { CSRFToken } from '~/components/Molecules/CSRFToken'
import TagSearch from '~/components/Organisms/TagSearch/TagSearch'
import { FORM_TYPES } from '~/utils/constants'
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
    const submit = useSubmit()
    const [topNotes, setTopNotes] = useState<any[]>(data?.perfumeNotesOpen || [])
    const [heartNotes, setHeartNotes] = useState<any[]>(data?.perfumeNotesHeart || [])
    const [baseNotes, setBaseNotes] = useState<any[]>(data?.perfumeNotesClose || [])
    const [serverError, setServerError] = useState<string | null>(null)

    useEffect(() => {
      if (lastResult && !lastResult.success) {
        setServerError(lastResult.error as unknown as string)
      }
    }, [lastResult])

    // Update state when data changes (e.g., when editing an existing perfume)
    useEffect(() => {
      if (data?.perfumeNotesOpen) {
        setTopNotes(data.perfumeNotesOpen)
      }
      if (data?.perfumeNotesHeart) {
        setHeartNotes(data.perfumeNotesHeart)
      }
      if (data?.perfumeNotesClose) {
        setBaseNotes(data.perfumeNotesClose)
      }
    }, [data])

    // Debug logging for note state changes
    useEffect(() => {
      console.log('Note states updated:', { topNotes, heartNotes, baseNotes })
    }, [topNotes, heartNotes, baseNotes])

    // Dynamically update hidden inputs when note states change
    useEffect(() => {
      const formElement = document.getElementById(formType)
      if (!formElement) {
        console.error('Form element not found with id:', formType)
        return
      }

      // Remove existing note inputs
      const existingInputs = formElement.querySelectorAll('input[name^="notes"]')
      existingInputs.forEach(input => input.remove())

      // Add current note states as hidden inputs
      topNotes.forEach(note => {
        if (!note.id) {
          console.warn('Note missing id:', note)
          return
        }
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = 'notesTop'
        input.value = note.id
        formElement.appendChild(input)
      })

      heartNotes.forEach(note => {
        if (!note.id) {
          console.warn('Note missing id:', note)
          return
        }
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = 'notesHeart'
        input.value = note.id
        formElement.appendChild(input)
      })

      baseNotes.forEach(note => {
        if (!note.id) {
          console.warn('Note missing id:', note)
          return
        }
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = 'notesBase'
        input.value = note.id
        formElement.appendChild(input)
      })

      console.log('Updated hidden inputs in DOM:', {
        topNotesCount: topNotes.length,
        heartNotesCount: heartNotes.length,
        baseNotesCount: baseNotes.length
      })
    }, [
topNotes, heartNotes, baseNotes, formType
])

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
        className="p-6 rounded-md noir-border max-w-6xl mx-auto bg-noir-dark/10 flex flex-col gap-3"
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
        <CSRFToken />
        {data?.id && <input type="hidden" name="perfumeId" value={data.id} />}
        {serverError && (
          <div className="bg-red-500 text-lg font-semibold px-3 py-2 max-w-max rounded-2xl border-2 text-white">
            {serverError}
          </div>
        )}
        <Button type="submit" className="max-w-max">
          {formType === FORM_TYPES.CREATE_PERFUME_FORM ? 'Create Perfume' : 'Update Perfume'}
        </Button>
      </Form>
    )
  }

export default PerfumeForm
