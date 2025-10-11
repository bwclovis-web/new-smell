import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { type ChangeEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MetaFunction } from 'react-router'

import Select from '~/components/Atoms/Select'
import SearchBar from '~/components/Organisms/SearchBar'
import { getAllFeatures } from '~/models/feature.server'

import banner from '../images/scent.webp'

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('home.meta.title') },
    { name: 'description', content: t('home.meta.description') }
  ]
}

export async function loader() {
  const features = await getAllFeatures()
  return {
    features
  }
}
gsap.registerPlugin(useGSAP)
export default function Home() {
  const [searchType, setSearchType] = useState<'perfume-house' | 'perfume'>('perfume')
  const container = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  useGSAP(
    () => {
      gsap.fromTo(
        ".hero-image",
        { filter: "grayscale(100%) contrast(0.5) brightness(0.4)" },
        { filter: "grayscale(100%) contrast(1.4) brightness(0.9)", duration: 2 }
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

  const handleSelectType = (evt: ChangeEvent<HTMLSelectElement>) => {
    setSearchType(evt.target.value as 'perfume-house' | 'perfume')
  }
  const data = [
    { id: 'perfume-house', name: t('home.radio.houses'), label: t('home.radio.houses') },
    { id: 'perfume', name: t('home.radio.perfumes'), label: t('home.radio.perfumes') }
  ]
  return (
    <div className="relative z-10 top-0 pb-20 md:pb-0">
      <div className="flex flex-col gap-8 items-center md:justify-center min-h-screen px-4 relative bg-noir-gold-500/30" ref={container}>
        <img
          src={banner}
          alt=""
          className="absolute object-cover w-full h-full filter grayscale-[100%] contrast-[1.4] brightness-[0.9] sepia-[0.2] mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-noir-black/85 mask-radial-from-10% mask-radial-to-74% md:mask-radial-from-25% md:mask-radial-to-44%"></div>
        <section className='text-noir-gold relative z-10 flex flex-col items-center gap-4 pt-40 md:pt-0'>
          <div className='text-shadow-lg/90 text-shadow-noir-black text-center'>
            <h1 className="hero-title">
              {t('home.heading')}
            </h1>
            <p className="subtitle opacity-0">{t('home.subheading')}</p>
          </div>
          <div className='flex items-baseline justify-start w-full max-w-4xl mt-6'>
            <Select
              size="expanded"
              value={searchType}
              action={handleSelectType}
              selectId='search-type'
              selectData={data}
              defaultId={searchType}
              ariaLabel={t('components.search.ariaLabel')}
            />
            <SearchBar
              searchType={searchType}
              variant='flat'
              className="mt-2 md:mt-8"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
