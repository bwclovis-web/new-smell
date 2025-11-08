import type { ReactNode } from "react"

import { OptimizedImage } from "~/components/Atoms/OptimizedImage"

interface HeroHeaderProps {
  title: string
  image?: string | null
  imageAlt?: string
  transitionKey?: string | number
  viewTransitionName?: string
  children?: ReactNode
  headerClassName?: string
  bodyClassName?: string
  titleClassName?: string
  imageClassName?: string
  heightClassName?: string
  sizes?: string
  imageWidth?: number
  imageHeight?: number
  imageQuality?: number
  priority?: boolean
}

const DEFAULT_HEADER_CLASSES =
  "flex items-end justify-center mb-10 relative w-full overflow-hidden"
const DEFAULT_HEIGHT_CLASS = "h-[600px]"
const DEFAULT_BODY_CLASSES =
  "relative z-10 px-8 text-center filter w-full rounded-lg py-4 text-shadow-lg text-shadow-noir-black/90"
const DEFAULT_TITLE_CLASS = "text-noir-gold"
const DEFAULT_IMAGE_CLASSES =
  "w-full h-full object-cover mb-2 rounded-lg absolute top-0 left-0 right-0 z-0 details-title filter contrast-[1.4] brightness-[0.9] sepia-[0.2] mix-blend-screen mask-linear-gradient-to-b"

const HeroHeader = ({
  title,
  image,
  imageAlt,
  transitionKey,
  viewTransitionName,
  children,
  headerClassName = "",
  bodyClassName = "",
  titleClassName = DEFAULT_TITLE_CLASS,
  imageClassName = DEFAULT_IMAGE_CLASSES,
  heightClassName = DEFAULT_HEIGHT_CLASS,
  sizes = "100vw",
  imageWidth = 1200,
  imageHeight = 600,
  imageQuality = 85,
  priority = true,
}: HeroHeaderProps) => {
  const computedViewTransitionName =
    viewTransitionName ??
    (transitionKey !== undefined ? `hero-image-${transitionKey}` : undefined)

  return (
    <header
      className={`${DEFAULT_HEADER_CLASSES} ${heightClassName} ${headerClassName}`.trim()}
    >
      {image ? (
        <OptimizedImage
          src={image}
          alt={imageAlt ?? title}
          priority={priority}
          width={imageWidth}
          height={imageHeight}
          quality={imageQuality}
          className={imageClassName}
          sizes={sizes}
          viewTransitionName={computedViewTransitionName}
          placeholder="blur"
        />
      ) : (
        <div className="w-full h-full bg-noir-dark/50 rounded-lg absolute top-0 left-0 right-0 z-0 flex items-center justify-center">
          <span className="text-noir-gold/40">No Image</span>
        </div>
      )}

      <div
        className={`${DEFAULT_BODY_CLASSES} ${bodyClassName}`.trim()}
      >
        {children ?? <h1 className={titleClassName}>{title}</h1>}
      </div>
    </header>
  )
}

export default HeroHeader


