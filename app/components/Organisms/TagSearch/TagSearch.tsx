import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps, useState } from 'react'
import { NavLink } from 'react-router'

import { Button } from '~/components/Atoms/Button/Button'
import { styleMerge } from '~/utils/styleUtils'

import { tagSearchVariants } from './tagsearch-variants'

interface TagSearchProps extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof tagSearchVariants> { }

const TagSearch: FC<TagSearchProps> = ({ className, ...props }) => {
  const [showThing, setShowThing] = useState(false)
  const [results, setResults] = useState([])
  const [openDropdown, setOpenDropdown] = useState(!!results.length)

  const handleKeyUp = async (evt: KeyboardEvent<HTMLInputElement>) => {
    const query = (evt.target as HTMLInputElement).value
    const url = '/api/getTag'
    const res = await fetch(`${url}?tag=${encodeURIComponent(query)}`)
    const data = await res.json()
    setResults(data)
    setOpenDropdown(!!data.length)
  }

  return (
    <div
      className={
        styleMerge(tagSearchVariants({ className }))
      }
      data-cy="TagSearch"
      {...props}
    >
      <Button type="button" onClick={() => setShowThing(!showThing)}>OH HAI</Button>
      {showThing && (
        <div className="flex flex-col gap-2 relative">
          <div className="flex flex-col gap-2">
            <label htmlFor="tag-search">Tag Search</label>
            <input
              type="text"
              id="tag-search"
              onKeyUp={evt => {
                handleKeyUp(evt)
              }}
            />
            {openDropdown && (
              <ul className="bg-white rounded-b-md absolute w-full -bottom-18">
                {results.map((item: any) => (
                  <li key={item.id} className="p-2 hover:bg-noir-gray hover:text-noir-light cursor-pointer last-of-type:rounded-b-md">
                    <Button className="block w-full h-full" type="button">
                      {item.name}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* <div className="flex flex-col gap-2">
            <label htmlFor="tag-search">Tag Search</label>
            <input type="text" id="tag-search" />
          </div> */}
        </div>
      )}
    </div>
  )
}
export default TagSearch
