import type { FC, RefObject } from 'react'

import Input from '~/components/Atoms/Input/Input'

interface ContactFieldsetProps {
  inputRef: RefObject<HTMLInputElement | null>
  data?: {
    phone: string
    email: string
    website: string
  }
  actions: {
    phone: any
    email: any
    website: any
  }
}
const ContactFieldset: FC<ContactFieldsetProps> = ({ inputRef, data, actions }) => (
  <fieldset className="flex  gap-2">
    <legend className="text-2xl text-noir-gray font-bold mb-2">Contact</legend>
    <Input
      inputType="text"
      inputRef={inputRef}
      action={actions.phone}
      inputId="phone"
      defaultValue={data?.phone}
    />
    <Input
      inputType="text"
      inputRef={inputRef}
      action={actions.email}
      inputId="email"
      defaultValue={data?.email}
    />
    <Input
      inputType="text"
      inputRef={inputRef}
      action={actions.website}
      inputId="website"
      defaultValue={data?.website}
    />
  </fieldset>
)

export default ContactFieldset
