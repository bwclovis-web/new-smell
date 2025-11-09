import { Button } from "~/components/Atoms/Button"
import PerfumeHouseAddressBlock from "~/components/Containers/PerfumeHouse/AddressBlock/PerfumeHouseAddressBlock"

interface PerfumeHouseSummaryCardProps {
  perfumeHouse: any
  totalPerfumeCount: number
  selectedLetter?: string | null
  onBackClick: () => void
}

const PerfumeHouseSummaryCard = ({
  perfumeHouse,
  totalPerfumeCount,
  selectedLetter,
  onBackClick,
}: PerfumeHouseSummaryCardProps) => (
    <div className="noir-border relative bg-white/5 text-noir-gold-500">
      <PerfumeHouseAddressBlock perfumeHouse={perfumeHouse} />
      {perfumeHouse.description && (
        <p className="px-4 pt-4">{perfumeHouse.description}</p>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pb-4 pt-4">
        <span className="text-xs uppercase tracking-[0.3em] text-noir-gold/70">
          Total perfumes
        </span>
        <span
          className="text-2xl font-semibold text-noir-gold"
          data-testid="perfume-count"
        >
          {totalPerfumeCount}
        </span>
      </div>
      <span className="tag absolute">{perfumeHouse.type}</span>
      <Button
        onClick={onBackClick}
        variant="primary"
        background="gold"
        size="sm"
        className="gap-2 max-w-max ml-2 mb-2 mt-2"
        aria-label={
          selectedLetter
            ? `Back to houses starting with ${selectedLetter}`
            : "Back to houses"
        }
      >
        ← Back to {selectedLetter || "Houses"}
      </Button>
    </div>
  )

export default PerfumeHouseSummaryCard


