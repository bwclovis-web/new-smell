import type { RefObject } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "~/components/Atoms/Button"

import LinkCard from "../LinkCard/LinkCard"

interface DataDisplaySectionProps {
  data: any[]
  isLoading: boolean
  infiniteLoading: boolean
  hasMore: boolean
  totalCount: number
  observerRef: RefObject<HTMLDivElement>
  onLoadMore: () => void
  type: "house" | "perfume"
  selectedLetter: string | null
  scrollContainerRef: RefObject<HTMLDivElement>
  sourcePage?: string
  useVirtualScrolling?: boolean
  virtualScrollThreshold?: number
  itemHeight?: number
  containerHeight?: number
}

const DataDisplaySection = ({
  data,
  isLoading,
  infiniteLoading,
  hasMore,
  totalCount,
  observerRef,
  onLoadMore,
  type,
  selectedLetter,
  scrollContainerRef,
  sourcePage,
}: DataDisplaySectionProps) => {
  const { t } = useTranslation()
  const itemName = type === "house" ? "houses" : "perfumes"
  // const itemNameSingular = type === 'house' ? 'house' : 'perfume'

  if (!selectedLetter && data.length === 0) {
    return (
      <div className="inner-container my-6 text-center py-12">
        <h2 className="text-xl text-noir-gold mb-4">
          {t("components.dataDisplaySection.heading", { itemName })}
        </h2>
        <p className="text-noir-gold/80">
          {t("components.dataDisplaySection.subheading", { itemName })}
        </p>
      </div>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      className="inner-container my-6 overflow-y-auto style-scroll"
    >
      <ul className="grid grid-cols-2 gap-6 md:grid-cols-2 2xl:grid-cols-4 auto-rows-fr">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="text-noir-gold">
              {t("common.loading", { itemName })} for letter "{selectedLetter}
              "...
            </div>
          </div>
        ) : (
          data.map((item: any) => (
            <li key={item.id} className="h-full">
              <LinkCard
                data={item}
                type={type}
                selectedLetter={selectedLetter}
                sourcePage={sourcePage}
              />
            </li>
          ))
        )}
      </ul>

      <div
        ref={observerRef}
        aria-live="polite"
        aria-busy={infiniteLoading}
        role="status"
        className="sticky bottom-0 w-full bg-gradient-to-t from-noir-black to-transparent flex flex-col items-center justify-center py-4 mt-6"
      >
        {infiniteLoading && (
          <span className="text-noir-gold">
            {t("common.loadingMore", { itemName })}
          </span>
        )}
        {!infiniteLoading && hasMore && (
          <Button onClick={onLoadMore}>{t("common.loadMore", { itemName })}</Button>
        )}
        {!hasMore && data.length > 0 && (
          <span className="text-noir-gold">
            {totalCount > 0
              ? t("common.allLoaded", { itemName, count: totalCount })
              : t("common.noMore", { itemName })}
          </span>
        )}
      </div>
    </div>
  )
}

export default DataDisplaySection
