import { FC, ReactElement } from 'react'

import { styleMerge } from '@/utils/styleUtils'

import { tabsPanelVariants } from '../tabs-variants'
interface TabPanelProps {
  idx: number
  child: ReactElement
  activeTab: number
  type: 'secondary'
}

const TabPanel: FC<TabPanelProps> = ({ idx, child, activeTab, type }) => (
  <section
    key={`panel-${idx}`}
    id={`panel-${idx}`}
    role="tabpanel"
    tabIndex={0}
    aria-labelledby={`tab-${idx}`}
    hidden={activeTab !== idx}
    className={styleMerge(tabsPanelVariants({ type }))}
  >
    {child.props.content}
  </section>
)

export default TabPanel
