import { HeroHeader } from "~/components/Molecules/HeroHeader"

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
  <HeroHeader
    title={name}
    image={image ?? undefined}
    transitionKey={transitionKey}
    viewTransitionName={`perfume-image-${transitionKey}`}
    titleClassName="text-noir-gold"
    imageWidth={900}
    imageHeight={600}
    imageQuality={85}
  />
)

export default PerfumeHouseHero


