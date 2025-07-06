import { type VariantProps } from "class-variance-authority"
import { type FC, type HTMLProps } from "react"

import { styleMerge } from "~/utils/styleUtils"

import { voodoodetailsVariants } from "./voodoodetails-variants"

interface VooDooDetailsProps extends HTMLProps<HTMLDetailsElement>,
  VariantProps<typeof voodoodetailsVariants> { }

const VooDooDetails: FC<VooDooDetailsProps> =
  ({ className, summary, name, children, ...props }) => (
    <details name={name} className={styleMerge(voodoodetailsVariants({ className }))} data-cy="VooDooDetails"{...props}>
      <summary className="cursor-pointer">
        <span className="text-lg font-semibold">{summary || "VooDoo Details"}</span>
      </summary>
      {children}
    </details>
  )
export default VooDooDetails  
