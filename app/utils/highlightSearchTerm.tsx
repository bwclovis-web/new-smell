/**
 * Highlights matching text in search results
 * @param text - The text to highlight
 * @param searchTerm - The search term to highlight
 * @returns JSX element with highlighted text
 */
export function highlightSearchTerm(text: string, searchTerm: string): JSX.Element {
  if (!searchTerm.trim()) {
    return <span>{text}</span>
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, index) => {
        if (regex.test(part)) {
          return (
            <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
              {part}
            </mark>
          )
        }
        return part
      })}
    </span>
  )
}
