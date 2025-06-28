import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { type ChangeEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MetaFunction } from 'react-router'

import RadioSelect from '~/components/Atoms/RadioSelect/RadioSelect'
import SearchBar from '~/components/Organisms/SearchBar/SearchBar'
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
  const [searchType, setSearchType] = useState<'perfume-house' | 'perfume'>('perfume-house')
  const container = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  useGSAP(
    () => {
      gsap.to('.features', {
        duration: 0.4, ease: 'power1.inOut', opacity: 1, startAt: { y: 500 }, y: 280
      })
    },
    { scope: container }
  )

  const handleSelectType = (evt: ChangeEvent<HTMLInputElement>) => {
    setSearchType(evt.target.value as 'perfume-house' | 'perfume')
  }
  return (
    <div className="flex flex-col gap-8 items-center min-h-screen px-4 relative" ref={container}>
      <img src={banner} alt="" className="absolute object-cover w-full h-1/2 lg:h-2/3 rounded-md border-10 border-amber-50 drop-shadow-xl drop-shadow-noir-gold/40" />
      <section className="features translate-y-full opacity-0 text-noir-dark  min-h-max relative w-full md:w-3/4 xl:w-3/4 mx-auto border border-noir-gold py-5 px-6 rounded-md bg-noir-light/60 backdrop-blur shadow-md">
        <h1 className="text-center callout">{t('home.heading')}</h1>
        <p className="text-center text-xl mb-4 pb-2 ">{t('home.subheading')}</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-4">
          <RadioSelect
            handleRadioChange={evt => handleSelectType(evt)}
            data={[
              { id: '1', name: 'type', type: 'radio', label: t('home.radio.houses'), value: 'perfume-house', defaultChecked: true },
              { id: '2', name: 'type', type: 'radio', label: t('home.radio.perfumes'), value: 'perfume' }
            ]}
          />
        </div>
        <SearchBar searchType={searchType} className="mt-8" />
      </section>
    </div>
  )
}
