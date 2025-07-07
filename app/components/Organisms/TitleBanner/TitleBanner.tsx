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
    <header className="mb-4 bg-noir-dark py-16 pl-2 pr-6 relative border-4 border-noir-light rounded-lg drop-shadow-xl drop-shadow-noir-black/70">
      <img
        src={image}
        loading="lazy"
        width={300}
        height={300}
        alt=""
        className={`w-full h-full object-cover ${imagePos} ${flipImage && 'scale-x-[-1]'} mb-2 rounded-lg absolute top-0 left-0 right-0 z-0  opacity-70 dark:opacity-60`} />
      <div className='relative z-10 w-full max-w-max px-8 backdrop-blur-sm bg-noir-dark/20 rounded-lg py-4 text-noir-light text-shadow-md text-shadow-noir-dark'>
        <h1>{heading}</h1>
        <p className='text-xl'>{subheading}</p>
        {children && (
          <div>
            {children}
          </div>
        )}
      </div>
    </header>
  )
export default TitleBanner  
