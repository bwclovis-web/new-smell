import { type FC, type ReactNode } from "react"

interface TitleBannerProps {
  image: string
  heading: string
  subheading: string
  children?: ReactNode,
  imagePos?: "object-center" | "object-top" | "object-bottom"
}

const TitleBanner: FC<TitleBannerProps> =
  ({ image, heading, subheading, children, imagePos = "object-center", flipImage }) => (
    <header className="mb-4 bg-noir-dark py-8 md:py-16 md:pl-2 pr-6 relative border-4 border-noir-light rounded-lg drop-shadow-xl drop-shadow-noir-black/70">
      <img
        src={image}
        loading="lazy"
        width={300}
        height={300}
        alt=""
        className={`w-full h-full object-cover ${imagePos} ${flipImage && 'scale-x-[-1]'} mb-2 rounded-lg absolute top-0 left-0 right-0 z-0 brightness-50`} />
      <div className='relative z-10 w-full max-w-max p-2 md:px-8  rounded-lg md:py-4 text-noir-light text-shadow-md text-shadow-noir-dark'>
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
export default TitleBanner  
