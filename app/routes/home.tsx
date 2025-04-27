import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { type MetaFunction, useLoaderData } from 'react-router'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'
import { getAllFeatures } from '~/models/feature.server'

import banner from '../images/voodoo.webp'

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('home.heading') },
    { name: 'description', content: t('home.description') }
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
  const { features } = useLoaderData<typeof loader>()
  const container = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  useGSAP(
    () => {
      gsap.to('.content', {
        duration: 0.5, ease: 'power2.inOut', opacity: 1, y: 100
      })
      gsap.to('.features', {
        duration: 0.4, ease: 'power1.inOut', opacity: 1, startAt: { y: 500 }, y: 100
      })
    },
    { scope: container }
  )
  return (
    <div className="flex flex-col gap-8 items-center h-full bg-purple-900 px-4 relative" ref={container}>
      <GlobalNavigation />
      <img src={banner} alt="" className="absolute object-cover w-full h-full opacity-60 z-10" />
      <section className="features translate-y-full opacity-0 text-pink-900  min-h-max relative z-40 w-full md:w-3/4 xl:w-2/4 mx-auto border border-pink-600 py-5 px-3 rounded-md bg-pink-200/60 backdrop-blur ">
        <h2 className="text-center text-5xl font-black">{t('home.heading')}</h2>
        <p className="text-center text-xl mb-4 pb-2 border-b border-purple-800/60">{t('home.subheading')}</p>
        <p>{t('home.description')}</p>
        {features.map(feature => (
          <details key={feature.id} className="flex flex-col gap-3">
            <summary className="cursor-pointer py-3 px-3 text-xl font-black uppercase">{feature.summary}</summary>
            <p className="text-xl" dangerouslySetInnerHTML={{ __html: feature.detail }} />
          </details>
        ))}
      </section>
    </div>
  )
}
