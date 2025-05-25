import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useRef } from 'react'
import { Outlet } from 'react-router'

import banner from '~/images/login.webp'
const RootLayout = () => {
  const container = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.to('.content', {
        duration: 0.5, ease: 'power2.inOut', opacity: 1, y: 80
      })
      gsap.to('.form', {
        duration: 0.5, ease: 'power2.inOut', opacity: 1
      })
    },
    { scope: container }
  )
  return (
    <div className="position-relative flex flex-col gap-8 items-center h-full px-4 relative" ref={container}>
      <img src={banner} alt="" className="absolute object-cover w-full h-1/2 lg:h-3/4 z-10 rounded-md border-10 border-amber-50 shadow-sm" />
      <div className="relative z-40 w-full flex items-start">
        <div className="mx-auto border border-noir-gold py-5 px-3 rounded-md bg-noir-dark/50 backdrop-blur-xs shadow-md text-gray-100 content opacity-0 translate-y-20">
          <h1 className="text-xl font-bold text-shadow-lg text-shadow-black">Create Account</h1>
          <p className="text-lg">Register to access your account</p>
        </div>
        <div className=" w-1/2 form translate-y-60 opacity-0 ">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default RootLayout
