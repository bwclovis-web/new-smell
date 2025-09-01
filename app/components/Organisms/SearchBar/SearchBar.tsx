import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps, type KeyboardEvent, useState } from 'react'
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

const SearchBar: FC<SearchBarProps> =
  ({ className, searchType, action, placeholder, variant }) => {
    const [results, setResults] = useState<any[]>([])
    const [searchValue, setSearchValue] = useState('')
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

    const handleKeyUp = async (evt: KeyboardEvent<HTMLInputElement>) => {
      const query = (evt.target as HTMLInputElement).value
      const url = searchType === 'perfume-house' ? '/api/perfume-houses' : '/api/perfume'
      const res = await fetch(`${url}?name=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)

      // Calculate dropdown position
      if (data.length > 0) {
        const input = evt.target as HTMLInputElement
        const rect = input.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        })
      }
    }

    const handleAction = (item: any) => {
      if (action) {
        action(item)
        setResults([])
        setSearchValue('')
      } else {
        // eslint-disable-next-line no-console
        console.warn('No action provided for SearchBar')
      }
    }

    const RenderLink = ({ item }: { item: any }) => (
      <NavLink viewTransition to={`/${searchType}/${item.name}`} className="block w-full h-full">
        {({ isTransitioning }) => (
          <span className={`contain-layout ${isTransitioning ? 'image-title' : 'none'}`}>
            {item.name}
          </span>
        )}
      </NavLink>
    )

    return (
      <div className="relative w-full">
        <form className="flex gap-2" onSubmit={evt => evt.preventDefault()}>
          <label htmlFor="search" className="sr-only">Search</label>
          <input
            type="text"
            id="search"
            autoComplete="off"
            onChange={evt => setSearchValue(evt.target.value)}
            value={searchValue}
            placeholder={placeholder || `Search ${searchType}`}
            onKeyUp={evt => {
              handleKeyUp(evt)
            }}
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
