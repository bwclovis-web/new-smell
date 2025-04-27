import { useTranslation } from 'react-i18next'

import { Button } from './Atoms/Button/Button'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="flex gap-4 justify-center items-center">
      <Button style="secondary" size="sm" onClick={() => handleLanguageChange('en')}>English</Button>
      <Button style="secondary" size="sm" onClick={() => handleLanguageChange('es')}>Español</Button>
    </div>
  )
}

export default LanguageSwitcher
