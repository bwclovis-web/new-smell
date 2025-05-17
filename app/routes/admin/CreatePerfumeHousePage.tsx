import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useEffect, useRef, useState } from 'react'
import { type ActionFunctionArgs, Form, useActionData } from 'react-router'

import { Button } from '~/components/Atoms/Button/Button'
import Input from '~/components/Atoms/Input/Input'
import Select from '~/components/Atoms/Select/Select'
import countryData from '~/data/countryList.json'
import { houseTypes } from '~/data/SelectTypes'
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
  const [serverError, setServerError] = useState<string | null>(null)

  const [
    createHouseForm,
    { name, description, image, website, email, phone, address, founded }
  ] = useForm({
    lastResult: lastResult && lastResult.success ? lastResult : null,
    constraint: getZodConstraint(CreatePerfumeHouseSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: CreatePerfumeHouseSchema })
    }
  })

  useEffect(() => {
    if (lastResult && !lastResult.success) {
      setServerError(lastResult.error as unknown as string)
    }
  }, [lastResult])

  return (
    <div>
      <h1 className="mb-6">Create Perfume House</h1>
      <Form
        method="POST"
        {...getFormProps(createHouseForm)}
        autoComplete="off"
        className=" p-4 rounded-md noir-outline flex flex-col gap-3"
      >
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
        <div className="grid grid-cols-2 gap-2">
          <Input
            inputType="text"
            inputRef={inputRef}
            action={founded}
            inputId="founded"
          />
          <Select label="House Type" selectId="type" selectData={houseTypes} />
        </div>
        <Input
          inputType="text"
          inputRef={inputRef}
          action={image}
          inputId="image"
        />
        <fieldset className="flex  gap-2">
          <legend className="text-2xl text-noir-gray font-bold mb-2">Address</legend>
          <div className="flex gap-2 w-full">
            <Input
              inputType="text"
              inputRef={inputRef}
              action={address}
              inputId="address"
            />
            <Select selectData={countryData} selectId="country" label="country" />
          </div>
        </fieldset>
        <fieldset className="flex  gap-2">
          <legend className="text-2xl text-noir-gray font-bold mb-2">Contact</legend>
          <Input
            inputType="text"
            inputRef={inputRef}
            action={phone}
            inputId="phone"
          />
          <Input
            inputType="text"
            inputRef={inputRef}
            action={email}
            inputId="email"
          />
          <Input
            inputType="text"
            inputRef={inputRef}
            action={website}
            inputId="website"
          />
        </fieldset>
        {serverError && (
          <div className="bg-red-500 text-lg font-semibold px-3 py-2 max-w-max rounded-2xl border-2 text-white">
            {serverError}
          </div>
        )}
        <Button type="submit" className="mt-4 max-w-max">
          Create Perfume House
        </Button>
      </Form>
    </div>
  )
}

export default CreatePerfumeHousePage
