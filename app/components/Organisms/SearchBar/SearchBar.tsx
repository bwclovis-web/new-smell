import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps, type KeyboardEvent, useState } from 'react'
import { NavLink } from 'react-router'

import { styleMerge } from '~/utils/styleUtils'

import { searchbarVariants } from './searchbar-variants'

interface SearchBarProps extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof searchbarVariants> {
  searchType: 'perfume-house' | 'perfume'
  placeholder?: string
}

const SearchBar: FC<SearchBarProps> =
  ({ className, searchType, action, placeholder, variant }) => {
    const [results, setResults] = useState([])
    const [searchValue, setSearchValue] = useState('')

    const handleKeyUp = async (evt: KeyboardEvent<HTMLInputElement>) => {
      const query = (evt.target as HTMLInputElement).value
      const url = searchType === 'perfume-house' ? '/api/perfume-houses' : '/api/perfume'
      const res = await fetch(`${url}?name=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)
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

    const RenderLink = ({ item }) => (
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
        {results.length > 0 && (
          <ul className="bg-noir-dark rounded-b-md absolute w-full mx-auto left-0 right-0 border-l-8 border-b-8 border-r-8 border-noir-gold/80 border-double z-10 max-h-52 overflow-y-auto">
            {results.map((item: any) => (
              <li key={item.id} className="p-2 text-noir-gold-100 hover:bg-noir-gold hover:text-noir-black font-semibold cursor-pointer last-of-type:rounded-b-md transition-colors">
                {action ?
                  <button className='block min-w-full text-left' onClick={() => handleAction(item)}>{item.name}</button> :
                  <RenderLink item={item} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
export default SearchBar
