import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps, type KeyboardEvent, useState } from 'react'

import RadioSelect from '~/components/Atoms/RadioSelect/RadioSelect'
import { styleMerge } from '~/utils/styleUtils'

import { searchbarVariants } from './searchbar-variants'

interface SearchBarProps extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof searchbarVariants> { }

const SearchBar: FC<SearchBarProps> = ({ className }) => {
  const [results, setResults] = useState([])
  const [searchType, setSearchType] = useState('houses')

  const handleKeyUp = async (evt: KeyboardEvent<HTMLInputElement>) => {
    const query = (evt.target as HTMLInputElement).value
    const url = searchType === 'houses' ? '/api/perfume-houses' : '/api/perfume'
    const res = await fetch(`${url}?name=${encodeURIComponent(query)}`)
    const data = await res.json()
    setResults(data)
  }

  const handleSelectType = evt => {
    setSearchType(evt.target.value)
  }

  return (
    <>
      <div className="flex flex-col">
        <label htmlFor="search" className="sr-only">Search</label>
        <input
          type="text"
          id="search"
          placeholder="Search..."
          onKeyUp={evt => {
            handleKeyUp(evt)
          }}
          className={styleMerge(searchbarVariants({ className }))}
        />
        <RadioSelect
          handleRadioChange={evt => handleSelectType(evt)}
          data={[
            { id: '1', name: 'type', type: 'radio', label: 'Perfume Houses', value: 'houses', defaultChecked: true },
            { id: '2', name: 'type', type: 'radio', label: 'Perfumes', value: 'perfumes' }
          ]}
        />
      </div>
      {results.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {results.map((item: any) => (
              <li key={item.id} className="p-2 hover:bg-gray-100 cursor-pointer">
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>

  )
}
export default SearchBar
