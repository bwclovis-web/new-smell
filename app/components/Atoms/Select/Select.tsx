import { type VariantProps } from 'class-variance-authority'
import { type ChangeEvent, type FC, type HTMLProps } from 'react'

import { styleMerge } from '~/utils/styleUtils'

import { selectVariants, selectWrapperVariants } from './select-variants'

interface SelectProps extends Omit<HTMLProps<HTMLInputElement>, 'action'>,
  VariantProps<typeof selectWrapperVariants> {
  selectId: string
  // eslint-disable-next-line no-unused-vars
  action: (evt: ChangeEvent<HTMLSelectElement>) => void
  defaultId?: string | number
  ariaLabel?: string
  size?: 'default' | 'compact' | 'expanded'
  selectData: Array<{
    id: string | number
    name: string
  }>
}

const Select: FC<SelectProps> = ({
  className, label, selectId, selectData, defaultId, action, ariaLabel, size }) => {
  const handleChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    if (action) {
      action(evt)
    }
  }

  return (
    <div
      className={styleMerge(selectWrapperVariants({ className }))}
      data-cy="Select"
    >
      {!ariaLabel && <label htmlFor={selectId} className="block-label">{label}</label>}
      <select
        onChange={evt => handleChange(evt)}
        id={selectId}
        aria-label={ariaLabel ?? undefined}
        name={selectId}
        className={styleMerge(selectVariants({ className, size }))}
      >
        {selectData.map(item => (
          <option key={item.id} value={item.id} selected={item.id === defaultId} className="bg-noir-dark">
            {item.label}
          </option>
        ))}
      </select>
    </div>
  )
}
export default Select
