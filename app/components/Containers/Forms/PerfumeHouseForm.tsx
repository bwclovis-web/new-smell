import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useEffect, useRef, useState } from 'react'
import { Form } from 'react-router'

import { Button } from '~/components/Atoms/Button/Button'
import { FORM_TYPES } from '~/utils/constants'
import { CreatePerfumeHouseSchema } from '~/utils/formValidationSchemas'

import AddressFieldset from './Partials/AddressFieldset'
import ContactFieldset from './Partials/ContactFiledset'
import InfoFieldset from './Partials/InfoFieldset'

interface PerfumeHouseFormProps {
  formType: typeof FORM_TYPES[keyof typeof FORM_TYPES]
  lastResult: any
  data?: any
}

const PerfumeHouseForm = ({ formType, lastResult, data }: PerfumeHouseFormProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  useEffect(() => {
    if (lastResult && !lastResult.success) {
      setServerError(lastResult.error as unknown as string)
    }
  }, [lastResult])
  const [
    form,
    { name, description, image, website, email, phone, address, founded }
  ] = useForm({
    id: formType,
    lastResult: lastResult && lastResult.success ? lastResult : null,
    constraint: getZodConstraint(CreatePerfumeHouseSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: CreatePerfumeHouseSchema })
    }
  })

  return (
    <Form
      method="POST"
      {...getFormProps(form)}
      autoComplete="off"
      className=" p-4 rounded-md noir-outline flex flex-col gap-3"
    >
      <InfoFieldset
        inputRef={inputRef}
        data={data}
        actions={{ name, description, image, founded }}
      />
      <AddressFieldset address={address} inputRef={inputRef} data={data} />
      <ContactFieldset
        inputRef={inputRef}
        data={data}
        actions={{ phone, website, email }}
      />
      {serverError && (
        <div className="bg-red-500 text-lg font-semibold px-3 py-2 max-w-max rounded-2xl border-2 text-white">
          {serverError}
        </div>
      )}
      <input type="hidden" name="houseId" value={data?.id} />
      <Button type="submit" className="mt-4 max-w-max">
        {formType === FORM_TYPES.CREATE_HOUSE_FORM ? 'Create Perfume House' : 'Submit Changes'}
      </Button>
    </Form>
  )
}
export default PerfumeHouseForm
