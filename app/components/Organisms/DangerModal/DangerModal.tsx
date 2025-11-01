import type { ReactNode } from "react"

const DangerModal = ({ children }: { children?: ReactNode }) => (
  <div className="text-center mx-auto">
    <h2>Are you sure you want to Remove?</h2>
    <p className="text-noir-gold-100 text-xl">
      Once Removed you will lose all history, notes and entries in the exchange.
    </p>
    <div className="mt-4">{children}</div>
  </div>
)
export default DangerModal
