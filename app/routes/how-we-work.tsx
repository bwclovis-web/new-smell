import { useTranslation } from 'react-i18next'
import { type MetaFunction } from 'react-router'

import TitleBanner from '~/components/Organisms/TitleBanner'

import banner from '../images/behind.webp'

export const ROUTE_PATH = '/how-we-work'

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('howWeWork.meta.title') },
    { name: 'description', content: t('howWeWork.meta.description') }
  ]
}

export const loader = async () => ({})

const HowWeWorkPage = () => {
  const { t } = useTranslation()

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t('howWeWork.heading')}
        subheading={t('howWeWork.subheading')}
      />

      <div className="inner-container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg prose-invert max-w-none">
            <h2 className="text-noir-gold text-2xl font-bold mb-6">
              {t('howWeWork.section1.title')}
            </h2>
            <p className="text-noir-light mb-6 leading-relaxed">
              {t('howWeWork.section1.content')}
            </p>

            <h2 className="text-noir-gold text-2xl font-bold mb-6 mt-12">
              {t('howWeWork.section2.title')}
            </h2>
            <p className="text-noir-light mb-6 leading-relaxed">
              {t('howWeWork.section2.content')}
            </p>

            <h2 className="text-noir-gold text-2xl font-bold mb-6 mt-12">
              {t('howWeWork.section3.title')}
            </h2>
            <p className="text-noir-light mb-6 leading-relaxed">
              {t('howWeWork.section3.content')}
            </p>

            <h2 className="text-noir-gold text-2xl font-bold mb-6 mt-12">
              {t('howWeWork.section4.title')}
            </h2>
            <p className="text-noir-light mb-6 leading-relaxed">
              {t('howWeWork.section4.content')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowWeWorkPage
