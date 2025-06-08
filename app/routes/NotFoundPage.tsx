import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-noir-light">
      <h1 className="text-4xl font-bold mb-4">{t('404.heading', 'Looking a bit lost')}</h1>
      <p className="text-lg mb-6">{t('404.subheading', 'The page you are looking for does not exist.')}</p>
      <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
        {t('404.homeLink', 'Head back home')}
      </Link>
    </div>
  )
}

export default NotFoundPage
