import { type VariantProps } from 'class-variance-authority'
import { type ChangeEvent, type FC, type HTMLProps } from 'react'

import { styleMerge } from '~/utils/styleUtils'

import { radioSelectVariants } from './radioSelect-variants'

interface RadioSelectProps extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof radioSelectVariants> {
  handleRadioChange: (evt: ChangeEvent<HTMLInputElement>) => void
}

const RadioSelect: FC<RadioSelectProps>
  = ({ className, data, handleRadioChange }) => (
    <div className="flex gap-2">
      {data?.map(item => (
        <div
          key={item.id}
          className={styleMerge(radioSelectVariants({ className }))}
        >
          <input
            type="radio"
            value={item.value}
            defaultChecked={item.defaultChecked}
            onChange={handleRadioChange}
            name={item.name}
            id={item.id}
            className="h-4 w-4 cursor-pointer rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="cursor-pointer text-sm font-medium text-gray-900" htmlFor={item.id}>
            {item.label}
          </label>
        </div>
      ))}
    </div>
  )
export default RadioSelect
