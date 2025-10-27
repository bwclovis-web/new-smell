import { useTranslation } from 'react-i18next'
import { type MetaFunction } from 'react-router'

import TitleBanner from '~/components/Organisms/TitleBanner'

import banner from '../images/about.webp'

export const ROUTE_PATH = '/about-us'

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('aboutUs.meta.title') },
    { name: 'description', content: t('aboutUs.meta.description') }
  ]
}

export const loader = async () => ({})

const AboutUsPage = () => {
  const { t } = useTranslation()

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t('aboutUs.heading')}
        subheading={t('aboutUs.subheading')}
      />

      <article className="inner-container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg prose-invert max-w-none">
            <h2 className="text-noir-gold text-2xl font-bold mb-6">
              {t('aboutUs.content.subheading')}
            </h2>
            <div className="flex flex-col gap-6 text-noir-light leading-relaxed text-lg">
              <p>
                {t('aboutUs.content.one')}
              </p>
              <p>
                {t('aboutUs.content.two')}
              </p>
              <p>
                {t('aboutUs.content.three')}
              </p>
              <p>
                {t('aboutUs.content.four')}
              </p>
              <p>
                {t('aboutUs.content.five')}
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}

export default AboutUsPage
