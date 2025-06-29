import { type FC } from "react"

interface TitleBannerProps {
  image: string
  heading: string
  subheading: string
  children?: ReactNode
}

const TitleBanner: FC<TitleBannerProps> =
  ({ image, heading, subheading, children }) => (
    <header className="mb-4 bg-noir-dark py-12 pl-2 pr-6 relative border-4 border-noir-light rounded-lg drop-shadow-xl drop-shadow-noir-black/70">
      <img
        src={image}
        loading="lazy"
        width={300}
        height={300}
        alt=""
        className="w-full h-full object-cover object-center mb-2 rounded-lg absolute top-0 left-0 right-0 z-0  opacity-70" />
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
