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
  <div className="p-4 bg-noir-dark text-noir-gold-100 flex gap-4">
    <div className="flex flex-col items-start gap-2">
      <span className='font-medium  tracking-wide pb-1 text-2xl text-noir-gold'>{t('singlePerfume.notes.general')}: </span>
      <ul className="flex font-semibold capitalize flex-wrap ">
        {notes.map((note, idx) => (
          <li key={note.id}>
            {note.name}
            {idx + 1 < notes.length && <span className='pr-1 pl-0'>, </span>}
          </li>
        ))}
      </ul>
    </div>
  </div >
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
  <div className=" p-4 bg-noir-dark text-noir-gold-100 flex flex-col md:flex-row gap-4">
    {hasOpen && (
      <div className="flex flex-col items-start gap-1 border-r-4 md:border-r-noir-gold pr-4">
        <span className='font-medium tracking-wide pb-1 text-2xl text-noir-gold'>{t('singlePerfume.notes.opening')}</span>
        <ul className="flex capitalize flex-wrap mb-2.5">
          {perfumeNotesOpen.map((note, idx) => (
            <li key={note.id}>
              {note.name}
              {idx + 1 < perfumeNotesOpen.length && <span className='pr-1'>,</span>}
            </li>
          ))}
        </ul>
      </div>
    )}
    {hasHeart && (
      <div className="flex flex-col items-start border-r-2 md:border-r-noir-gold-100 pr-4 last-of-type:border-r-0">
        <span className='font-medium tracking-wide pb-1 text-2xl text-noir-gold'>{t('singlePerfume.notes.mid')}</span>
        <ul className="flex font-semibold capitalize flex-wrap mb-2">
          {perfumeNotesHeart.map((note, idx) => (
            <li key={note.id}>
              {note.name}
              {idx + 1 < perfumeNotesHeart.length && <span className='pr-1'>,</span>}
            </li>
          ))}
        </ul>
      </div>
    )}
    {
      hasClose && (
        <div className="flex flex-col items-start border-r-2 md:border-r-noir-gold-100 pr-4 last-of-type:border-r-0">
          <span className='font-medium tracking-wide pb-1 text-2xl text-noir-gold'>{t('singlePerfume.notes.end')} </span>
          <ul className="flex  font-semibold capitalize flex-wrap">
            {perfumeNotesClose.map((note, idx) => (
              <li key={note.id}>
                {note.name}
                {idx + 1 < perfumeNotesClose.length && <span className='pr-1'>,</span>}
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
