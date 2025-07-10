import { type Dispatch, type SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import { MdDeleteForever } from "react-icons/md"
import { useFetcher, useNavigation } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import VooDooDetails from "~/components/Atoms/VooDooDetails/VooDooDetails"
import type { UserPerfumeI } from "~/types"

import DeStashForm from "../DeStashForm/DeStashForm"
import GeneralDetails from "./bones/GeneralDetails"
import PerfumeComments from "./bones/PerfumeComments"

interface MySentListItemI {
  userPerfume: UserPerfumeI
  setUserPerfumes: Dispatch<SetStateAction<UserPerfumeI[]>>
  userPerfumes: UserPerfumeI[]
}

const MyScentsListItem = ({ userPerfume, setUserPerfumes, userPerfumes }:
  MySentListItemI) => {
  const { t } = useTranslation()
  const fetcher = useFetcher()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const handleDecantConfirm = (amount: string) => {
    const foundUserPerfume =
      userPerfumes.find(item => item.id === userPerfume.id)
    if (!foundUserPerfume) {
      // eslint-disable-next-line no-console
      console.error('User perfume not found for de-stashing')
      return
    }

    // Use an approach that preserves the original array order
    setUserPerfumes(prev => prev.map(perfume => perfume.id === userPerfume.id
      ? { ...perfume, available: amount }
      : perfume))

    const formData = new FormData()
    formData.append('perfumeId', foundUserPerfume.perfume.id)
    formData.append('availableAmount', amount)
    formData.append('action', 'decant')

    fetcher.submit(formData, { method: 'post', action: '/admin/my-scents' })
  }

  const handleRemovePerfume = (perfumeId: string) => {
    // Optimistically remove the perfume from the UI
    setUserPerfumes(prev => prev.filter(perfume => perfume.perfume.id !== perfumeId))

    const formData = new FormData()
    formData.append('perfumeId', perfumeId)
    formData.append('action', 'remove')
    fetcher.submit(formData, { method: 'post', action: '/admin/my-scents' })
  }

  return (
    <li key={userPerfume.id} className="border rounded p-4 flex flex-col w-full bg-noir-dark text-noir-light mb-4 last-of-type:mb-0">
      <div className="flex justify-between items-center mb-2 gap-6">
        <div className='flex gap-8'>
          <h3 className="font-medium flex flex-col justify-start items-start max-w-[40ch] min-w-[40ch] text-left">
            <span className='text-xl'>{t('myScents.listItem.name')}</span>
            <span className='text-2xl'>{userPerfume.perfume.name}</span>
          </h3>
          <p className='flex flex-col items-start justify-start'>
            <span className='text-lg'>{t('myScents.listItem.total')}</span>
            <span className='text-xl'>{userPerfume.amount} ml</span>
          </p>
          <p className='flex flex-col items-start justify-start'>
            <span className='text-lg'>{t('myScents.listItem.destashed')}</span>
            <span className='text-xl'>{userPerfume.available || '0'} ml</span>
          </p>
        </div>
        <div className='flex gap-4'>
          <Button
            className="bg-red-500  hover:bg-red-600 focus:bg-red-700 disabled:bg-red-400 border-red-700 gap-2"
            onClick={() => handleRemovePerfume(userPerfume.perfume.id)}
            disabled={isSubmitting}
            variant={'icon'}
            size="sm"
          >
            <span className="text-white/90 font-bold text-sm">
              {
                isSubmitting
                  ? t('myScents.listItem.removing')
                  : t('myScents.listItem.removeButton')
              }
            </span>
            <MdDeleteForever size={40} fill="white" />
          </Button>
        </div>
      </div>

      <VooDooDetails summary={t('myScents.listItem.viewDetails')} className="text-start pt-3 mt-3 border-t-noir-gold border-t" name="perfume-details">
        <GeneralDetails userPerfume={userPerfume} />
        <VooDooDetails summary={t('myScents.listItem.viewComments')} className="text-start text-noir-dark  py-3 mt-3 bg-noir-gold px-2 rounded" name="inner-details">
          <PerfumeComments userPerfume={userPerfume} />
        </VooDooDetails>
        <VooDooDetails summary={t('myScents.listItem.setDestashed')} className="text-start text-noir-dark font-bold py-3 mt-3 bg-noir-gold px-2 rounded" name="inner-details">
          <DeStashForm
            handleDecantConfirm={handleDecantConfirm}
            userPerfume={userPerfume}
          />
        </VooDooDetails>
      </VooDooDetails>
    </li>
  )
}

export default MyScentsListItem
