import { OptimizedImage } from "~/components/Atoms/OptimizedImage"

interface PerfumeHouseHeroProps {
  name: string
  image?: string | null
  transitionKey: string | number
}

const PerfumeHouseHero = ({
  name,
  image,
  transitionKey,
}: PerfumeHouseHeroProps) => (
  <header className="flex items-end justify-center mb-10 relative h-[600px]">
    {image ? (
      <OptimizedImage
        src={image}
        alt={name}
        priority
        width={1200}
        height={600}
        quality={85}
        className="w-full h-full object-cover mb-2 rounded-lg absolute top-0 left-0 right-0 z-0 details-title filter contrast-[1.4] brightness-[0.9] sepia-[0.2] mix-blend-screen mask-linear-gradient-to-b"
        sizes="100vw"
        viewTransitionName={`perfume-image-${transitionKey}`}
        placeholder="blur"
      />
    ) : (
      <div className="w-full h-full bg-noir-dark/50 rounded-lg absolute top-0 left-0 right-0 z-0 flex items-center justify-center">
        <span className="text-noir-gold/40">No Image</span>
      </div>
    )}

    <div className="relative z-10 px-8 text-center filter w-full rounded-lg py-4 text-shadow-lg text-shadow-noir-black/90">
      <h1 className="text-noir-gold">{name}</h1>
    </div>
  </header>
)

export default PerfumeHouseHero


