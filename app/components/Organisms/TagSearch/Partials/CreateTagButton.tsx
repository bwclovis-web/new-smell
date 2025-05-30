import { useState } from 'react'

import { Button } from '~/components/Atoms/Button/Button'
const CreateTagButton = ({ action, setOpenDropdown }) => {
  const [showInput, setShowInput] = useState(false)
  const [tagValue, setTagValue] = useState('')

  const handleCreateTag = async () => {
    const url = '/api/createTag'
    const res = await (await (fetch(`${url}?tag=${encodeURIComponent(tagValue)}`))).json()
    setOpenDropdown(false)
    action(res)
  }

  return (
    <>

      <div className="flex flex-col gap-2">
        <label htmlFor="tag-search">Create new tag</label>
        <input
          type="text"
          autoComplete="off"
          id="tag-search"
          onChange={evt => setTagValue(evt.target.value)}
          value={tagValue}
          className="w-full rounded-sm border border-gray-500 px-2 py-1 text-lg mt-1 transition-all focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-noir-gold focus:border-transparent focus:ring-offset-2 dark:bg-noir-gray dark:text-white dark:focus:bg-noir-gray/20 dark:focus:ring-offset-noir-gray"
          onFocusCapture={() => {
            setShowInput(true)
          }}

        />
        <Button
          className="block w-full h-full max-w-max mt-2"
          type="button"
          size="md"
          onClick={() => {
            handleCreateTag()
            setTagValue('')
            setShowInput(false)
          }}
        >
          Create Tag
        </Button>
      </div>

    </>

  )
}

export default CreateTagButton
