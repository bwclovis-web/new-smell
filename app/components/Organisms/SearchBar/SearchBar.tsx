import { type VariantProps } from "class-variance-authority"
import {
  type ChangeEvent,
  type HTMLProps,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { NavLink } from "react-router"

import { useDebouncedSearch } from "~/hooks/useDebouncedSearch"
import { highlightSearchTerm } from "~/utils/highlightSearchTerm"
import { styleMerge } from "~/utils/styleUtils"

import { searchbarVariants } from "./searchbar-variants"

interface SearchBarProps
  extends HTMLProps<HTMLDivElement>,
    VariantProps<typeof searchbarVariants> {
  searchType: "perfume-house" | "perfume"
  placeholder?: string
  action?: (item: any) => void
}

const SearchBar = ({
  className,
  searchType,
  action,
  placeholder,
  variant,
}: SearchBarProps) => {
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  // Create search function for the debounced hook
  const searchFunction = useCallback(
    async (query: string) => {
      const url =
        searchType === "perfume-house" ? "/api/perfume-houses" : "/api/perfume"
      const res = await fetch(`${url}?name=${encodeURIComponent(query)}`)
      if (!res.ok) {
        throw new Error("Search request failed")
      }
      return await res.json()
    },
    [searchType]
  )

  // Use debounced search hook
  const { searchValue, setSearchValue, results, isLoading, error, clearResults } =
    useDebouncedSearch(searchFunction, { delay: 300, minLength: 2 })

  // Update dropdown position when results change
  useEffect(() => {
    if (results.length > 0 && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [results])

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(evt.target.value)
  }

  const handleKeyUp = (evt: KeyboardEvent<HTMLInputElement>) => {
    // Debounced search handles this automatically
  }

  const handleAction = (item: any) => {
    if (action) {
      action(item)
      clearResults()
    } else {
      console.warn("No action provided for SearchBar")
    }
  }

  const RenderLink = ({ item }: { item: any }) => {
    const routePath =
      searchType === "perfume-house"
        ? `/perfume-house/${item.slug}`
        : `/perfume/${item.slug}`

    return (
      <NavLink
        viewTransition
        to={routePath}
        className="block w-full h-full capitalize"
      >
        {({ isTransitioning }) => (
          <span
            className={`contain-layout ${isTransitioning ? "image-title" : "none"}`}
          >
            {highlightSearchTerm(item.name, searchValue)}
          </span>
        )}
      </NavLink>
    )
  }

  return (
    <div className="relative w-full">
      <form className="flex gap-2" onSubmit={evt => evt.preventDefault()}>
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <input
          ref={inputRef}
          type="text"
          id="search"
          autoComplete="off"
          onChange={handleChange}
          value={searchValue}
          placeholder={placeholder || `Search ${t(`home.searchType.${searchType}`)}`}
          onKeyUp={handleKeyUp}
          className={styleMerge(searchbarVariants({ className, variant }))}
        />
      </form>
      {(results.length > 0 || isLoading || error) &&
        createPortal(
          <ul
            className="bg-noir-dark rounded-b-md border-l-8 border-b-8 absolute border-r-8 border-noir-gold/80 border-double z-[99999] max-h-52 overflow-y-auto shadow-2xl"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            {isLoading && (
              <li className="p-2 text-noir-gold-100 text-center">
                <span className="animate-pulse">Searching...</span>
              </li>
            )}
            {error && (
              <li className="p-2 text-red-400 text-center">
                <span>Search error: {error}</span>
              </li>
            )}
            {!isLoading &&
              !error &&
              results.map((item: any) => (
                <li
                  key={item.id}
                  className="p-2 text-noir-gold-100 hover:bg-noir-gold hover:text-noir-black font-semibold cursor-pointer last-of-type:rounded-b-md transition-colors"
                >
                  {action ? (
                    <button
                      className="block min-w-full text-left capitalize"
                      onClick={() => handleAction(item)}
                    >
                      {highlightSearchTerm(item.name, searchValue)}
                    </button>
                  ) : (
                    <RenderLink item={item} />
                  )}
                </li>
              ))}
            {!isLoading &&
              !error &&
              results.length === 0 &&
              searchValue.length >= 2 && (
                <li className="p-2 text-noir-gold-100 text-center">
                  <span>No results found</span>
                </li>
              )}
          </ul>,
          document.body
        )}
    </div>
  )
}
export default SearchBar
