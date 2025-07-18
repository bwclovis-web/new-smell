import { FC, ReactNode } from 'react'

interface TapItemProps {
  label: string
  content: ReactNode
}
const TabItem: FC<TapItemProps> = ({ label, content }) => (
  <div>
    <span>{label}</span>
    <div>{content}</div>
  </div>
)

export default TabItem
