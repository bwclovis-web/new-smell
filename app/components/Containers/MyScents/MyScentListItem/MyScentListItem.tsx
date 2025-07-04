import { type Dispatch, type SetStateAction, use, useRef, useState } from "react"
import { GrEdit } from "react-icons/gr"
import { RiDeleteBin2Fill, RiDeleteBin3Fill } from "react-icons/ri"
import { useFetcher, useNavigation } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import CheckBox from "~/components/Atoms/CheckBox/CheckBox"
import SessionContext from "~/providers/sessionProvider"
import type { UserPerfumeI } from "~/types"

import DecantForm from "../DecantForm/DecantForm"

interface MySentListItemI {
  userPerfume: UserPerfumeI
  setUserPerfumes: Dispatch<SetStateAction<UserPerfumeI[]>>
  userPerfumes: UserPerfumeI[]
}

const MyScentsListItem = ({ userPerfume, setUserPerfumes, userPerfumes }:
  MySentListItemI) => {
  const [decantOpenPerfumeId, setDecantOpenPerfumeId] = useState<string | null>(null)
  const fetcher = useFetcher()
  const { toggleModal } = use(SessionContext)
  const modalTrigger = useRef<HTMLButtonElement>(null)
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  // eslint-disable-next-line max-statements
  const handleDecantConfirm = (amount: string) => {
    if (!decantOpenPerfumeId) {
      return
    }
    const foundUserPerfume =
      userPerfumes.find(item => item.id === decantOpenPerfumeId)
    if (!foundUserPerfume) {
      return
    }
    setUserPerfumes(prev => prev.map(perfume => perfume.id === decantOpenPerfumeId
      ? { ...perfume, available: amount } :
      perfume))

    const formData = new FormData()
    formData.append('perfumeId', foundUserPerfume.perfume.id)
    formData.append('availableAmount', amount)
    formData.append('action', 'decant')

    fetcher.submit(formData, { method: 'post' })
    setDecantOpenPerfumeId(null)
  }

  const handleDecantCancel = () => {
    setDecantOpenPerfumeId(null)
  }

  const handleRemovePerfume = (perfumeId: string) => {
    const formData = new FormData()
    formData.append('perfumeId', perfumeId)
    formData.append('action', 'remove')
    fetcher.submit(formData, { method: 'post' })
  }

  return (
    <li key={userPerfume.id} className="border rounded p-4 flex flex-col w-full">
      <div className="flex justify-between items-center mb-2 gap-6">
        <div className='flex gap-8'>
          <h3 className="font-medium flex flex-col justify-start items-start">
            <span className='text-xl'>Name:</span>
            <span className='text-2xl'>{userPerfume.perfume.name}</span>
          </h3>
          <p className='flex flex-col items-start justify-start'>
            <span className='text-lg'>Amount:</span>
            <span className='text-xl'>{userPerfume.amount} ml</span>
          </p>
          <p className='flex flex-col items-start justify-start'>
            <span className='text-lg'>Available:</span>
            <span className='text-xl'>{userPerfume.available || '0'}</span>
          </p>
          <CheckBox
            inputType='wild'
            label="Decant"
            labelPosition='top'
            checked={decantOpenPerfumeId === userPerfume.id}
            onChange={() => {
              const isCurrentlyOpen =
                decantOpenPerfumeId === userPerfume.id
              const newId = isCurrentlyOpen ? null : userPerfume.id
              setDecantOpenPerfumeId(newId)
            }}
          />
        </div>
        <div className='flex gap-4'>
          <Button
            className="bg-green-600 text-sm hover:bg-green-700 focus:bg-green-800 disabled:bg-green-400 border-2 border-green-700"
            onClick={() => toggleModal(modalTrigger, '', userPerfume)}
            disabled={isSubmitting}
            ref={modalTrigger}
            variant={'icon'}
          >
            <GrEdit size={30} stroke='white' />
          </Button>
          <Button
            className="bg-red-500 text-sm border-2  hover:bg-red-600 focus:bg-red-700 disabled:bg-red-400 border-red-700"
            onClick={() => handleRemovePerfume(userPerfume.perfume.id)}
            disabled={isSubmitting}
            variant={'icon'}
          >
            {
              isSubmitting ?
                <RiDeleteBin3Fill size={30} fill='white' /> :
                <RiDeleteBin2Fill size={30} fill='white' />
            }
          </Button>
        </div>
      </div>
      {
        decantOpenPerfumeId === userPerfume.id && (
          <DecantForm
            handleDecantConfirm={handleDecantConfirm}
            handleDecantCancel={handleDecantCancel}
          />
        )
      }
    </li>
  )
}

export default MyScentsListItem
