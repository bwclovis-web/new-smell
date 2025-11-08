import { type VariantProps } from "class-variance-authority"
import { type HTMLProps, type ReactNode } from "react"

import { styleMerge } from "~/utils/styleUtils"

import {
  voodooDetailsSummaryVariants,
  voodoodetailsVariants,
} from "./voodoodetails-variants"

type VooDooDetailsProps = HTMLProps<HTMLDetailsElement> &
  VariantProps<typeof voodoodetailsVariants> &
  VariantProps<typeof voodooDetailsSummaryVariants> & {
    summary?: string
    name: string
    children: ReactNode
    defaultOpen?: boolean
  }

const VooDooDetails = ({
  className,
  summary,
  name,
  children,
  type,
  background,
  defaultOpen,
  ...props
}: VooDooDetailsProps) => {
  const detailsVariant = voodoodetailsVariants({ type })
  const summaryVariant = voodooDetailsSummaryVariants({ type, background })
  const detailsClassName = styleMerge(detailsVariant, className)
  const summaryClassName = styleMerge(summaryVariant)

  return (
    <details
      name={name}
      className={detailsClassName}
      data-cy="VooDooDetails"
      open={defaultOpen}
      {...props}
    >
      <summary className={summaryClassName}>
        {summary || "VooDoo Details"}
      </summary>
      {children}
    </details>
  )
}
export default VooDooDetails
