import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { type ReactNode, useRef } from "react"
interface TitleBannerProps {
  image: string
  heading: string
  subheading: string
  children?: ReactNode,
  imagePos?: "object-center" | "object-top" | "object-bottom"
  flipImage?: boolean
}
gsap.registerPlugin(useGSAP)
const TitleBanner =
  ({ image, heading, subheading, children, imagePos = "object-center", flipImage }: TitleBannerProps) => {
    const container = useRef<HTMLDivElement>(null)
    useGSAP(
      () => {
        gsap.fromTo(
          ".hero-image",
          {
            filter: "contrast(0) brightness(0.1)",
            opacity: 0
          },
          {
            filter: "contrast(1.4) brightness(1)",
            opacity: 1,
            duration: 2
          }
        )
        gsap.from(".hero-title", {
          opacity: 0,
          y: 50,
          duration: 1.2,
          ease: "power2.out"
        })
        gsap.fromTo(
          ".subtitle-sm",
          {
            opacity: 0,
            filter: "blur(6px)",
            y: 20
          },
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 2,
            delay: 1.2,
            ease: "power3.out"
          }
        )
      },
      { scope: container }
    )
    return (
      <header className="relative w-full title-banner flex items-end py-6 justify-center overflow-hidden">
        <div className="absolute inset-0 bg-noir-black/30 mask-t-from-5% mask-t-to-100% mask"></div>
        <img
          src={image}
          loading="lazy"
          width={300}
          height={300}
          alt=""
          className={`hero-image w-full h-full object-cover ${imagePos} ${flipImage && 'scale-x-[-1]'} mb-2 mt-14 md:mt-0 rounded-lg absolute top-0 left-0 right-0 z-0 filter grayscale-[100%] contrast-[1] brightness-[0.9] sepia-[0.2] mix-blend-overlay mask-linear-gradient-to-b`}
        />
        <div className='relative z-10 w-full max-w-max p-2 top-2 md:top-0 md:px-8 rounded-lg md:py-4 text-noir-gold text-center text-shadow-lg text-shadow-noir-black'>
          <h1 className='hero-title'>{heading}</h1>
          <p className='subtitle-sm filter'>{subheading}</p>
          {children && (
            <div className='p-2 mt-4 md:mt-6'>
              {children}
            </div>
          )}
        </div>
      </header>
    )
  }
export default TitleBanner  
