import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps, type KeyboardEvent, useState } from 'react'
import { NavLink } from 'react-router'

import { styleMerge } from '~/utils/styleUtils'

import { searchbarVariants } from './searchbar-variants'

interface SearchBarProps extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof searchbarVariants> {
  searchType: 'perfume-house' | 'perfume'
}

const SearchBar: FC<SearchBarProps> = ({ className, searchType, action }) => {
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
    <NavLink viewTransition to={`${searchType}/${item.name}`} className="block w-full h-full">
      {({ isTransitioning }) => (
        <span className={`contain-layout ${isTransitioning ? 'image-title' : 'none'}`}>
          {item.name}
        </span>
      )}
    </NavLink>
  )

  return (
    <>
      <div className="relative">
        <form className="flex gap-2 w-full md:w-1/2 lg:w-3/4 mx-auto" onSubmit={evt => evt.preventDefault()}>
          <label htmlFor="search" className="sr-only">Search</label>
          <input
            type="text"
            id="search"
            autoComplete="off"
            onChange={evt => setSearchValue(evt.target.value)}
            value={searchValue}
            placeholder="Search..."
            onKeyUp={evt => {
              handleKeyUp(evt)
            }}
            className={styleMerge(searchbarVariants({ className }))}
          />
        </form>
        {results.length > 0 && (
          <ul className="bg-white rounded-b-md absolute w-full md:w-1/2 lg:w-3/4">
            {results.map((item: any) => (
              <li key={item.id} className="p-2 hover:bg-noir-gray hover:text-noir-light cursor-pointer last-of-type:rounded-b-md">
                {action ?
                  <button className='block min-w-full text-left' onClick={() => handleAction(item)}>{item.name}</button> :
                  <RenderLink item={item} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
export default SearchBar
