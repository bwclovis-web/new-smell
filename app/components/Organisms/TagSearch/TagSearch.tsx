import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps, useState } from 'react'

import { Button } from '~/components/Atoms/Button/Button'
import Input from '~/components/Atoms/Input/Input'
import { styleMerge } from '~/utils/styleUtils'

import CreateTagButton from './Partials/CreateTagButton'
import TagList from './Partials/TagList'
import { tagSearchVariants } from './tagsearch-variants'

interface TagSearchProps extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof tagSearchVariants> { }

const TagSearch: FC<TagSearchProps> = ({ className, onChange, label, data }) => {
  const [inputValue, setInputValue] = useState('')
  const [results, setResults] = useState([])
  const [openDropdown, setOpenDropdown] = useState(!!results.length)
  const [selectedTags, setSelectedTags]
    = useState<any[]>(Array.isArray(data) ? data : [])

  const handleKeyUp = async evt => {
    const query = (evt.target as HTMLInputElement).value
    setInputValue(query)
    const url = '/api/getTag'
    const res = await (await (fetch(`${url}?tag=${encodeURIComponent(query)}`))).json()
    setResults(res)
    setOpenDropdown(!!res.length)
  }

  const handleItemClick = (item: any) => {
    if (!selectedTags.find(t => t.id === item.id)) {
      const newTags = [...selectedTags, item]
      setSelectedTags(newTags)
      onChange?.(newTags)
    }
  }

  return (
    <div
      className={styleMerge(tagSearchVariants({ className }))}
      data-cy="TagSearch"
    >
      <div className="flex flex-col mb-6">
        <label htmlFor="tag-search" className='block-label'>{`${label} search`}</label>
        <Input
          shading={true}
          type="text"
          autoComplete="off"
          id="tag-search"
          onKeyUp={handleKeyUp}
          value={inputValue}
          onChange={evt => setInputValue(evt.target.value)} inputType={''} inputRef={undefined} />
        {openDropdown && (
          <ul className="bg-white rounded-b-md w-full absolute z-10">
            {results.map((item: any) => (
              <li key={item.id} className="p-2 hover:bg-noir-gray hover:text-noir-light cursor-pointer last-of-type:rounded-b-md">
                <Button
                  className="block w-full h-full"
                  type="button"
                  onClick={() => {
                    handleItemClick(item)
                    setOpenDropdown(false)
                    setResults([])
                    setInputValue('')
                  }}
                >
                  {item.name}
                </Button>
              </li>
            ))}
            <li className="p-2 hover:bg-noir-gray hover:text-noir-light cursor-pointer last-of-type:rounded-b-md">
              <CreateTagButton
                action={handleItemClick}
                setOpenDropdown={setOpenDropdown}
              />
            </li>
          </ul>
        )}
      </div>
      <TagList selectedTags={selectedTags} label={label} />
    </div>
  )
}
export default TagSearch
