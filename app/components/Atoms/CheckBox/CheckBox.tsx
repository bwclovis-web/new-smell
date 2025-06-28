import type { VariantProps } from 'class-variance-authority'
import type { FC, HTMLProps } from 'react'

import { styleMerge } from '~/utils/styleUtils'

import { checkboxInputVariants, checkboxLabelVariants, checkboxVariants } from './checkbox-variants'

interface CheckBoxProps extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof checkboxVariants> {
  inputType?: VariantProps<typeof checkboxInputVariants>['inputType']
  labelSize?: VariantProps<typeof checkboxLabelVariants>['labelSize']
}

const CheckBox: FC<CheckBoxProps> = ({
  className,
  defaultChecked,
  label,
  labelPosition,
  labelSize,
  value,
  inputType,
  ...props }) => (
  <div
    className={styleMerge(checkboxVariants({ className, labelPosition }))}
    data-cy="CheckBox"
    {...props}
  >
    <label className={styleMerge(checkboxLabelVariants({ labelSize }))} aria-label="group" htmlFor={label}>{label}</label>
    <input className={styleMerge(checkboxInputVariants({ labelSize, inputType }))} type="checkbox" id={label} aria-describedby="" checked={defaultChecked} value={value} />
  </div>
)
export default CheckBox
