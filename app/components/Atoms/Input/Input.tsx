import { type FieldMetadata, getInputProps } from '@conform-to/react'
import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'

import { styleMerge } from '~/utils/styleUtils'

import { inputVariants } from './input-variants'

interface InputProps extends Omit<HTMLProps<HTMLInputElement>, 'action'>,
  VariantProps<typeof inputVariants> {
  inputType: 'email' | 'password' | 'text'
  inputId?: string
  inputRef: RefObject<HTMLInputElement | null>
  action: FieldMetadata<unknown>
  actionData?: {
    errors?: { [key: string]: string }
  }
}

const Input: FC<InputProps> = ({
  inputType,
  inputId = inputType,
  className,
  inputRef,
  defaultValue,
  actionData,
  action,
  ...props
}) => {
  const inputProps = {
    ...getInputProps(action, { ariaAttributes: true, type: inputType }),
    id: inputId
  }
  return (
    <div
      className={
        styleMerge(inputVariants({ className }))
      }
      data-cy="Input"
      {...props}
    >
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-noir-dark dark:text-white capitalize"
      >
        {action.name}
      </label>
      <input
        ref={inputRef}
        required
        defaultValue={defaultValue ? defaultValue : ''}
        aria-invalid={actionData?.errors?.action ? true : undefined}
        aria-describedby={`${inputId}-error`}
        className="w-full rounded-sm border border-gray-500 px-2 py-1 text-lg mt-1"
        {...inputProps}
      />
      {action.errors && (
        <span className="mb-2 text-sm text-destructive dark:text-destructive-foreground text-red-600 uppercase font-medium" id={`${inputId}-error`}>
          {action.errors.join(' ')}
        </span>
      )}
    </div>
  )
}
export default Input
