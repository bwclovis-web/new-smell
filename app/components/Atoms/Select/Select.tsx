import { type VariantProps } from "class-variance-authority"
import { type ChangeEvent, type HTMLProps } from "react"

import { styleMerge } from "~/utils/styleUtils"

import { selectVariants, selectWrapperVariants } from "./select-variants"

interface SelectProps
  extends Omit<HTMLProps<HTMLSelectElement>, "action" | "size">,
    VariantProps<typeof selectWrapperVariants> {
  selectId: string
   
  action?: (evt: ChangeEvent<HTMLSelectElement>) => void
  defaultId?: string | number
  ariaLabel?: string
  size?: "default" | "compact" | "expanded"
  selectData: Array<{
    label: string
    id: string | number
    name: string
  }>
}

const Select = ({
  className,
  label,
  selectId,
  selectData,
  defaultId,
  action,
  ariaLabel,
  size,
  ...rest
}: SelectProps) => {
  const handleChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    if (action) {
      action(evt)
    }
  }

  // Only use defaultValue if value is not provided (controlled vs uncontrolled)
  const selectProps = {
    ...rest,
    onChange: (evt: ChangeEvent<HTMLSelectElement>) => handleChange(evt),
    id: selectId,
    "aria-label": ariaLabel ?? undefined,
    name: selectId,
    className: styleMerge(selectVariants({ className, size })),
    ...(rest.value === undefined && defaultId !== undefined
      ? { defaultValue: defaultId }
      : {}),
  }

  return (
    <div
      className={styleMerge(selectWrapperVariants({ className, size }))}
      data-cy="Select"
    >
      {!ariaLabel && (
        <label
          className="font-semibold text-2xl mb-1 capitalize text-noir-gold text-shadow-lg text-shadow-noir-black/60 tracking-wide"
          htmlFor={selectId}
        >
          {label}
        </label>
      )}
      <select {...selectProps}>
        {selectData.map(item => (
          <option
            key={item.id}
            value={item.id}
            className="bg-noir-dark w-full"
          >
            {item.label}
          </option>
        ))}
      </select>
    </div>
  )
}
export default Select
