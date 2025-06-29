import { useTranslation } from 'react-i18next'

interface PerfumeNote {
  id: string
  name: string
}

interface PerfumeNotesProps {
  perfumeNotesOpen: PerfumeNote[]
  perfumeNotesHeart: PerfumeNote[]
  perfumeNotesClose: PerfumeNote[]
}

const renderSingleNotesList = (notes: PerfumeNote[], t: any) => (
  <div className="border py-2 rounded-md bg-noir-dark text-noir-light px-2">
    <div className="flex flex-col items-center gap-2">
      <span className='block w-full'>{t('singlePerfume.notes.general')}: </span>
      <ul className="flex font-semibold capitalize flex-wrap">
        {notes.map((note, idx) => (
          <li key={note.id}>
            {note.name}
            {idx + 1 < notes.length && <span>, </span>}
          </li>
        ))}
      </ul>
    </div>
  </div>
)

interface CategorizedNotesProps {
  perfumeNotesOpen: PerfumeNote[]
  perfumeNotesHeart: PerfumeNote[]
  perfumeNotesClose: PerfumeNote[]
  hasOpen: boolean
  hasHeart: boolean
  hasClose: boolean
  t: any
}

const renderCategorizedNotes = ({
  perfumeNotesOpen,
  perfumeNotesHeart,
  perfumeNotesClose,
  hasOpen,
  hasHeart,
  hasClose,
  t
}: CategorizedNotesProps) => (
  <div className="border py-2 rounded-md bg-noir-dark text-noir-light px-2">
    {hasOpen && (
      <div className="flex flex-col items-start gap-1">
        <span className='block w-full font-bold tracking-wide border-b border-noir-light/60 pb-1'>{t('singlePerfume.notes.opening')}: </span>
        <ul className="flex capitalize flex-wrap mb-2.5">
          {perfumeNotesOpen.map((note, idx) => (
            <li key={note.id}>
              {note.name}
              {idx + 1 < perfumeNotesOpen.length && <span>, </span>}
            </li>
          ))}
        </ul>
      </div>
    )}
    {hasHeart && (
      <div className="flex flex-col items-start  gap-2">
        <span className='block w-full font-bold tracking-wide border-b border-noir-light/60 pb-1'>{t('singlePerfume.notes.mid')}: </span>
        <ul className="flex gap-2 font-semibold capitalize flex-wrap mb-4">
          {perfumeNotesHeart.map((note, idx) => (
            <li key={note.id}>
              {note.name}
              {idx + 1 < perfumeNotesHeart.length && <span>, </span>}
            </li>
          ))}
        </ul>
      </div>
    )}
    {
      hasClose && (
        <div className="flex flex-col items-start gap-2">
          <span className='block w-full font-bold tracking-wide border-b border-noir-light/60 pb-1'>{t('singlePerfume.notes.end')}: </span>
          <ul className="flex gap-2 font-semibold capitalize flex-wrap">
            {perfumeNotesClose.map((note, idx) => (
              <li key={note.id}>
                {note.name}
                {idx + 1 < perfumeNotesClose.length && <span>, </span>}
              </li>
            ))}
          </ul>
        </div>
      )
    }
  </div >
)

const useNotesLogic = (
  perfumeNotesOpen: PerfumeNote[],
  perfumeNotesHeart: PerfumeNote[],
  perfumeNotesClose: PerfumeNote[]
) => {
  const hasOpen = perfumeNotesOpen.length > 0
  const hasHeart = perfumeNotesHeart.length > 0
  const hasClose = perfumeNotesClose.length > 0
  const noteTypesCount = [hasOpen, hasHeart, hasClose].filter(Boolean).length

  return { hasOpen, hasHeart, hasClose, noteTypesCount }
}

const PerfumeNotes = ({
  perfumeNotesOpen,
  perfumeNotesHeart,
  perfumeNotesClose
}: PerfumeNotesProps) => {
  const { t } = useTranslation()
  const { hasOpen, hasHeart, hasClose, noteTypesCount } = useNotesLogic(
    perfumeNotesOpen,
    perfumeNotesHeart,
    perfumeNotesClose
  )

  // If only one type has notes, show them as a single "notes" list
  if (noteTypesCount === 1) {
    const allNotes = [
      ...perfumeNotesOpen,
      ...perfumeNotesHeart,
      ...perfumeNotesClose
    ]
    return renderSingleNotesList(allNotes, t)
  }

  // Show separate categories when multiple types have notes
  return renderCategorizedNotes({
    perfumeNotesOpen,
    perfumeNotesHeart,
    perfumeNotesClose,
    hasOpen,
    hasHeart,
    hasClose,
    t
  })
}

export default PerfumeNotes
