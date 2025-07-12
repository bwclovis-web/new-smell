import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { type FC, type ReactNode, useRef } from "react"
interface TitleBannerProps {
  image: string
  heading: string
  subheading: string
  children?: ReactNode,
  imagePos?: "object-center" | "object-top" | "object-bottom"
}
gsap.registerPlugin(useGSAP)
const TitleBanner: FC<TitleBannerProps> =
  ({ image, heading, subheading, children, imagePos = "object-center", flipImage }) => {
    const container = useRef<HTMLDivElement>(null)
    useGSAP(
      () => {
        gsap.fromTo(
          ".hero-image",
          {
            filter: "grayscale(100%) contrast(0.5) brightness(0.4)",
            opacity: 0
          },
          {
            filter: "grayscale(100%) contrast(1.4) brightness(0.9)",
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
          ".subtitle",
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
      <header className="relative w-full h-[400px] lg:h-[900px]  flex items-end pb-6 justify-center overflow-hidden">
        <div className="absolute inset-0 bg-noir-black/30 mask-t-from-5% mask-t-to-100% mask"></div>
        <img
          src={image}
          loading="lazy"
          width={300}
          height={300}
          alt=""
          className={`hero-image w-full h-full object-cover ${imagePos} ${flipImage && 'scale-x-[-1]'} mb-2 rounded-lg absolute top-0 left-0 right-0 z-0 hero-image object-cover w-full h-full filter grayscale-[100%] contrast-[1.4] brightness-[0.9] sepia-[0.2] mix-blend-overlay mask-linear-gradient-to-b`}
        />
        <div className='relative z-10 w-full max-w-max p-2 md:px-8 rounded-lg md:py-4 text-noir-gold text-center text-shadow-md text-shadow-lg/90 text-shadow-noir-black'>
          <h1>{heading}</h1>
          <p className='subtitle'>{subheading}</p>
          {children && (
            <div>
              {children}
            </div>
          )}
        </div>
      </header>
    )
  }
export default TitleBanner  
