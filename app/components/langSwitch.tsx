import { useTranslation } from 'react-i18next'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="flex gap-4 justify-center items-center">
      <button className="cursor-pointer" onClick={() => handleLanguageChange('en')}>English</button>
      <button className="cursor-pointer" onClick={() => handleLanguageChange('es')}>Español</button>
    </div>
  )
}

export default LanguageSwitcher
