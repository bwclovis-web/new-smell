import { type FieldMetadata } from '@conform-to/react'
import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps } from 'react'

import { styleMerge } from '~/utils/styleUtils'

import { selectVariants } from './select-variants'

interface SelectProps extends Omit<HTMLProps<HTMLInputElement>, 'action'>,
  VariantProps<typeof selectVariants> {
  action?: FieldMetadata<unknown>
  selectId: string
  defaultId?: string | number
  selectData: Array<{
    id: string | number
    name: string
  }>
}

const Select: FC<SelectProps> = ({
  className, label, selectId, selectData, defaultId }) => (
  <div
    className={styleMerge(selectVariants({ className }))}
    data-cy="Select"
  >
    <label htmlFor={selectId} className="block text-sm font-medium text-noir-dark dark:text-white capitalize mb-1">{label}</label>
    <select id={selectId} name={selectId} className="w-full rounded-sm border border-gray-500 px-2 py-1 text-lg">
      {selectData.map(item => (
        <option key={item.id} value={item.id} selected={item.id === defaultId}>
          {item.name}
        </option>
      ))}
    </select>
  </div>
)
export default Select
