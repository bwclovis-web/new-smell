import type { FC } from 'react'

interface TagListProps {
  selectedTags: any[]
  label?: string
}

const TagList: FC<TagListProps> = ({ selectedTags, label }) => (
  <div className="flex flex-col gap-2 h-20 absolute bottom-0 w-full">
    <label htmlFor="tag-search" className='block-label'>{`Current ${label}`}</label>
    <ul className="bg-white flex rounded-b-md w-full h-full ">
      {selectedTags.map((item: any) => (
        <li key={item.id} className="p-2 hover:bg-noir-gray hover:text-noir-light cursor-pointer last-of-type:rounded-b-md">
          {item.name}
        </li>
      ))}
    </ul>
  </div>
)

export default TagList
