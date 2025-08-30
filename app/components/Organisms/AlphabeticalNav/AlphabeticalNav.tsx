import React from 'react'
import { getAlphabetLetters } from '~/utils/sortUtils'

interface AlphabeticalNavProps {
  selectedLetter: string | null
  onLetterSelect: (letter: string | null) => void
  className?: string
}

const AlphabeticalNav: React.FC<AlphabeticalNavProps> = ({
  selectedLetter,
  onLetterSelect,
  className = ''
}) => {
  const letters = getAlphabetLetters()

  return (
    <div className={`flex flex-wrap gap-2 justify-center mb-6 ${className}`}>
      <button
        onClick={() => onLetterSelect(null)}
        className={`px-3 py-2 rounded-md font-medium transition-colors ${selectedLetter === null
            ? 'bg-noir-gold text-noir-black'
            : 'bg-noir-dark text-noir-gold hover:bg-noir-gold/20'
          }`}
      >
        All
      </button>

      {letters.map(letter => (
        <button
          key={letter}
          onClick={() => onLetterSelect(letter)}
          className={`px-3 py-2 rounded-md font-medium transition-colors ${selectedLetter === letter
              ? 'bg-noir-gold text-noir-black'
              : 'bg-noir-dark text-noir-gold hover:bg-noir-gold/20'
            }`}
        >
          {letter}
        </button>
      ))}
    </div>
  )
}

export default AlphabeticalNav
