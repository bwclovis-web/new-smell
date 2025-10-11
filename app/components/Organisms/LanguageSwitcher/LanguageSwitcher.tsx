import { type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'

import Select from '~/components/Atoms/Select'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const languageOptions = [
    { id: 'en', label: 'English', name: 'en' },
    { id: 'es', label: 'Español', name: 'es' },
  ]

  const handleLanguageChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(evt.target.value)
  }

  return (
    <Select
      selectId="language-switcher"
      selectData={languageOptions}
      defaultId={i18n.language}
      action={handleLanguageChange}
      ariaLabel="Select Language"
      size="compact"
    />
  )
}

export default LanguageSwitcher
