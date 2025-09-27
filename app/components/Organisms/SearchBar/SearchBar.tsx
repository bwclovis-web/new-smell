import { type VariantProps } from 'class-variance-authority'
import { type ChangeEvent, type HTMLProps, type KeyboardEvent, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router'

import { styleMerge } from '~/utils/styleUtils'

import { searchbarVariants } from './searchbar-variants'

interface SearchBarProps extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof searchbarVariants> {
  searchType: 'perfume-house' | 'perfume'
  placeholder?: string
  action?: (item: any) => void
}

const SearchBar =
  ({ className, searchType, action, placeholder, variant }: SearchBarProps) => {
    const [results, setResults] = useState<any[]>([])
    const [searchValue, setSearchValue] = useState('')
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

    const handleSearch = async (query: string) => {
      if (query.length < 2) {
        setResults([])
        return
      }

      try {
        const url = searchType === 'perfume-house' ? '/api/perfume-houses' : '/api/perfume'
        const res = await fetch(`${url}?name=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)

        if (data.length > 0) {
          const input = document.getElementById('search') as HTMLInputElement
          if (input) {
            const rect = input.getBoundingClientRect()
            setDropdownPosition({
              top: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width
            })
          }
        } else {
          console.log('No search results for query:', query)
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      }
    }

    const handleKeyUp = async (evt: KeyboardEvent<HTMLInputElement>) => {
      const query = (evt.target as HTMLInputElement).value
      await handleSearch(query)
    }

    const handleChange = async (evt: ChangeEvent<HTMLInputElement>) => {
      const query = evt.target.value
      setSearchValue(query)
      await handleSearch(query)
    }

    const handleAction = (item: any) => {
      if (action) {
        action(item)
        setResults([])
        setSearchValue('')
      } else {
        console.warn('No action provided for SearchBar')
      }
    }

    const RenderLink = ({ item }: { item: any }) => {

      const routePath = searchType === 'perfume-house'
        ? `/perfume-house/${item.slug}`
        : `/perfume/${item.slug}`

      return (
        <NavLink viewTransition to={routePath} className="block w-full h-full">
          {({ isTransitioning }) => (
            <span className={`contain-layout ${isTransitioning ? 'image-title' : 'none'}`}>
              {item.name}
            </span>
          )}
        </NavLink>
      )
    }

    return (
      <div className="relative w-full">
        <form className="flex gap-2" onSubmit={evt => evt.preventDefault()}>
          <label htmlFor="search" className="sr-only">Search</label>
          <input
            type="text"
            id="search"
            autoComplete="off"
            onChange={handleChange}
            value={searchValue}
            placeholder={placeholder || `Search ${searchType}`}
            onKeyUp={handleKeyUp}
            className={styleMerge(searchbarVariants({ className, variant }))}
          />
        </form>
        {results.length > 0 && createPortal(
          <ul
            className="bg-noir-dark rounded-b-md fixed border-l-8 border-b-8 border-r-8 border-noir-gold/80 border-double z-[99999] max-h-52 overflow-y-auto shadow-2xl"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width
            }}
          >
            {results.map((item: any) => (
              <li key={item.id} className="p-2 text-noir-gold-100 hover:bg-noir-gold hover:text-noir-black font-semibold cursor-pointer last-of-type:rounded-b-md transition-colors">
                {action ?
                  <button className='block min-w-full text-left' onClick={() => handleAction(item)}>{item.name}</button> :
                  <RenderLink item={item} />}
              </li>
            ))}
          </ul>,
          document.body
        )}
      </div>
    )
  }
export default SearchBar
