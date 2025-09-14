import type { FC } from 'react'
import { useState } from 'react'
import { BsHeartFill, BsHearts } from 'react-icons/bs'
import { GrEdit } from 'react-icons/gr'
import { MdDeleteForever } from 'react-icons/md'

import { Button, VooDooLink } from '~/components/Atoms/Button'
import AddToCollectionModal from '~/components/Organisms/AddToCollectionModal'

interface Perfume {
  id: string
  name: string
}

interface PerfumeIconsProps {
  perfume: Perfume
  handleDelete: () => void
  userRole: string
  isInWishlist: boolean
}

const PerfumeIcons: FC<PerfumeIconsProps>
  = ({ perfume, handleDelete, userRole, isInWishlist }) => {
    const [inWishlist, setInWishlist] = useState(isInWishlist)

    const revertWishlistState = () => {
      setInWishlist(!inWishlist)
    }

    const updateWishlistAPI = async (formData: FormData) => {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        revertWishlistState()
      }
    }

    const handleWishlistToggle = async () => {
      const formData = new FormData()
      formData.append('perfumeId', perfume.id)
      formData.append('action', inWishlist ? 'remove' : 'add')

      // Optimistically update the UI first
      setInWishlist(!inWishlist)

      try {
        await updateWishlistAPI(formData)
      } catch {
        revertWishlistState()
      }
    }

    return (
      <div className="grid grid-cols-1 gap-2 noir-border relative p-4">
        <Button
          onClick={handleWishlistToggle}
          variant='icon'
          background='gold'
          size={'sm'}
          aria-label={`${inWishlist ? 'remove' : 'add'} ${perfume.name} ${inWishlist ? 'from' : 'to'} wishlist`}
        >

          {inWishlist
            ? (
              <div className="flex items-center justify-between gap-2">
                <span>In your wishlist</span>
                <BsHeartFill size={20} />
              </div>
            )
            : (
              <div className="flex items-center justify-between gap-2">
                <span>Add to wishlist</span>
                <BsHearts size={20} />
              </div>
            )}
        </Button>
        <AddToCollectionModal type="icon" perfume={perfume} />
        {userRole === 'admin'
          && (
            <div>
              <h3 className='text-lg font-semibold text-center text-noir-gold-500 mb-2'>Admin</h3>
              <div className='flex flex-col items-center justify-between gap-2'>
                <VooDooLink
                  aria-label={`edit ${perfume.name}`}
                  variant="icon"
                  background={'gold'}
                  size={'sm'}
                  className='flex items-center justify-between gap-2'
                  url={`/admin/perfume/${perfume.name}/edit`}
                >
                  <span>Edit Perfume</span>
                  <GrEdit size={22} />
                </VooDooLink>
                <Button
                  onClick={() => handleDelete()}
                  aria-label={`delete ${perfume.name}`}
                  variant="icon"
                  className='flex items-center justify-between gap-2'
                  background={'gold'}
                  size={'sm'}
                >
                  <span>Delete Perfume</span>
                  <MdDeleteForever size={22} />
                </Button>
              </div>
            </div>
          )
        }
      </div >
    )
  }

export default PerfumeIcons
