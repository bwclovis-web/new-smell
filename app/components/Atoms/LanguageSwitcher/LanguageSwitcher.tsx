import { useTranslation } from 'react-i18next'

import Button from '~/components/Atoms/Button'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="flex gap-4 justify-center items-center">
      <Button variant="secondary" size="sm" onClick={() => handleLanguageChange('en')}>English</Button>
      <Button variant="secondary" size="sm" onClick={() => handleLanguageChange('es')}>Español</Button>
    </div>
  )
}

export default LanguageSwitcher
