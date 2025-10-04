/* eslint-disable complexity */
import { type FieldMetadata, getInputProps } from '@conform-to/react'
import { type VariantProps } from 'class-variance-authority'
import { type HTMLProps, type RefObject } from 'react'

import { styleMerge } from '~/utils/styleUtils'

import { inputVariants, inputWrapperVariants } from './input-variants'

interface InputProps extends Omit<HTMLProps<HTMLInputElement>, 'action'>,
  VariantProps<typeof inputVariants> {
  inputType: 'email' | 'password' | 'text' | string
  inputId?: string
  label?: string
  placeholder?: string
  shading?: boolean
  inputRef: RefObject<HTMLInputElement | null>
  action?: FieldMetadata<unknown>
  actionData?: {
    errors?: { [key: string]: string }
  }
  autoComplete?: string
}

const Input = ({
  inputType,
  inputId = inputType,
  className,
  inputRef,
  defaultValue,
  actionData,
  action,
  label,
  placeholder,
  shading,
  autoComplete,
  ...props
}: InputProps) => {
  const inputProps = action
    ? {
      ...getInputProps(action, { ariaAttributes: true, type: inputType }),
      id: inputId,
      placeholder,
      autoComplete: autoComplete || (inputType === 'password' ? 'current-password' : inputType === 'email' ? 'email' : undefined)
    }
    : { id: inputId, type: inputType, placeholder, autoComplete: autoComplete || (inputType === 'password' ? 'current-password' : inputType === 'email' ? 'email' : undefined) }

  return (
    <div className={styleMerge(inputWrapperVariants({ className }))} data-cy="Input" {...props}>
      <label
        htmlFor={inputId}
        className='font-semibold text-2xl mb-1 capitalize text-noir-gold text-shadow-lg text-shadow-noir-black/60 tracking-wide'
      >
        {label ? label : action?.name}
      </label>
      <input
        name={action?.name}
        ref={inputRef}
        defaultValue={defaultValue ? defaultValue : ''}
        aria-invalid={actionData?.errors?.action ? true : undefined}
        aria-describedby={`${inputId}-error`}
        className={styleMerge(inputVariants({ shading }))}
        {...inputProps}
      />
      {/* {action?.errors && (
        <span className="text-sm text-destructive dark:text-destructive-foreground text-red-600 uppercase font-medium" id={`${inputId}-error`}>
          {action?.errors.join(' ')}
        </span>
      )} */}
    </div>
  )
}
export default Input
