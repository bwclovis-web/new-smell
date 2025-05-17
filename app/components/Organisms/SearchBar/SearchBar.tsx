import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps, type KeyboardEvent, useState } from 'react'
import { NavLink } from 'react-router'

import RadioSelect from '~/components/Atoms/RadioSelect/RadioSelect'
import { styleMerge } from '~/utils/styleUtils'

import { searchbarVariants } from './searchbar-variants'

interface SearchBarProps extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof searchbarVariants> { }

const SearchBar: FC<SearchBarProps> = ({ className }) => {
  const [results, setResults] = useState([])
  const [searchType, setSearchType] = useState('perfume-house')
  const [searchValue, setSearchValue] = useState('')

  const handleKeyUp = async (evt: KeyboardEvent<HTMLInputElement>) => {
    const query = (evt.target as HTMLInputElement).value
    const url = searchType === 'perfume-house' ? '/api/perfume-houses' : '/api/perfume'
    const res = await fetch(`${url}?name=${encodeURIComponent(query)}`)
    const data = await res.json()
    setResults(data)
  }

  const handleSelectType = evt => {
    setSearchType(evt.target.value)
    setResults([])
    setSearchValue('')
  }

  return (
    <>
      <div className="flex flex-col items-center relative">
        <RadioSelect
          handleRadioChange={evt => handleSelectType(evt)}
          data={[
            { id: '1', name: 'type', type: 'radio', label: 'Houses', value: 'perfume-house', defaultChecked: true },
            { id: '2', name: 'type', type: 'radio', label: 'Perfumes', value: 'perfume' }
          ]}
        />
        <form className="flex gap-2 w-full">
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
          <ul className="bg-white rounded-b-md absolute w-full -bottom-10">
            {results.map((item: any) => (
              <li key={item.id} className="p-2 hover:bg-noir-gray hover:text-noir-light cursor-pointer last-of-type:rounded-b-md">
                <NavLink viewTransition to={`${searchType}/${item.name}`} className="block w-full h-full">
                  {({ isTransitioning }) => (
                    <span className={`contain-layout ${isTransitioning ? 'image-title' : 'none'}`}>
                      {item.name}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
export default SearchBar
