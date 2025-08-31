import { useCallback, useRef, useState } from 'react'

interface UseLetterSelectionProps {
  loadDataByLetter: (letter: string) =>
    Promise<{ data: any[], totalCount: number } | null>
  resetData: (data: any[], totalCount: number) => void
}

const useLetterSelection = ({
  loadDataByLetter,
  resetData
}: UseLetterSelectionProps) => {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const resetDataRef = useRef(resetData)

  // Update the ref when resetData changes
  resetDataRef.current = resetData

  const handleLetterClick = useCallback(async (letter: string | null) => {
    if (letter === null) {
      setSelectedLetter(null)
      return
    }

    if (selectedLetter === letter) {
      // Deselect the letter
      setSelectedLetter(null)
      return
    }

    // Select new letter and load data
    setSelectedLetter(letter)
    const fetchedData = await loadDataByLetter(letter)

    // Initialize the infinite scroll hook with the new data
    if (fetchedData && fetchedData.data.length > 0) {
      resetDataRef.current(fetchedData.data, fetchedData.totalCount)
    }
  }, [selectedLetter, loadDataByLetter])

  return { selectedLetter, handleLetterClick }
}

export default useLetterSelection
