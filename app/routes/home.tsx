import type { MetaFunction } from 'react-router'

import banner from '../images/voodoo.webp'

export const meta: MetaFunction = () => [
  { title: 'New React Router App' },
  { name: 'description', content: 'Welcome to React Router!' }
]

export default function Home() {
  return (
    <div className="flex flex-col gap-8 items-center h-full bg-purple-900 px-4">
      <img src={banner} alt="" className="absolute object-cover w-full h-full opacity-60" />
    </div>
  )
}
