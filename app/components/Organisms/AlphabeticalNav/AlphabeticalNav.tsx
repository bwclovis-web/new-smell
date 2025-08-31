import type { FC } from 'react'

import { Button } from '~/components/Atoms/Button/Button'
import { getAlphabetLetters } from '~/utils/sortUtils'

interface AlphabeticalNavProps {
  selectedLetter: string | null
  // eslint-disable-next-line no-unused-vars
  onLetterSelect: (letter: string | null) => void
  className?: string
}

const AlphabeticalNav: FC<AlphabeticalNavProps> = ({
  selectedLetter,
  onLetterSelect,
  className = ''
}) => {
  const letters = getAlphabetLetters()

  return (
    <div className={`grid grid-cols-9 gap-4 justify-center inner-container mt-10 mb-18 ${className}`}>
      <Button
        onClick={() => onLetterSelect(null)}
        className={`px-3 py-2 rounded-md font-medium transition-colors relative ${selectedLetter === null
          ? 'bg-noir-gold text-noir-black'
          : 'bg-noir-dark text-noir-gold hover:bg-noir-gold/20 noir-outline'
          }`}
      >
        All
      </Button>

      {letters.map(letter => (
        <Button
          key={letter}
          onClick={() => onLetterSelect(letter)}
          className={`px-3 py-2 rounded-md font-medium transition-colors relative ${selectedLetter === letter
            ? 'bg-noir-gold text-noir-black'
            : 'bg-noir-dark text-noir-gold hover:bg-noir-gold/20 noir-outline'
            }`}
        >
          {letter}
        </Button>
      ))}
    </div>
  )
}

export default AlphabeticalNav
