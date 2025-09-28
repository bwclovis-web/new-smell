import type { FC } from 'react'
import { useState } from 'react'
import { BsHeartFill, BsHearts } from 'react-icons/bs'
import { GrEdit } from 'react-icons/gr'
import { MdDeleteForever } from 'react-icons/md'

import { Button, VooDooLink } from '~/components/Atoms/Button'
import AddToCollectionModal from '~/components/Organisms/AddToCollectionModal'
import { useCSRF } from '~/hooks/useCSRF'

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
    const [isPublic, setIsPublic] = useState(false)
    const [showWishlistForm, setShowWishlistForm] = useState(false)
    const { addToHeaders } = useCSRF()

    const revertWishlistState = () => {
      setInWishlist(!inWishlist)
    }

    const updateWishlistAPI = async (formData: FormData) => {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: addToHeaders(),
        body: formData
      })

      if (!response.ok) {
        revertWishlistState()
      }
    }

    const handleWishlistToggle = async () => {
      if (inWishlist) {
        // Remove from wishlist
        const formData = new FormData()
        formData.append('perfumeId', perfume.id)
        formData.append('action', 'remove')

        // Optimistically update the UI first
        setInWishlist(false)
        setShowWishlistForm(false)

        try {
          await updateWishlistAPI(formData)
        } catch {
          revertWishlistState()
        }
      } else {
        // Show form to add to wishlist with public/private option
        setShowWishlistForm(true)
      }
    }

    const handleAddToWishlist = async () => {
      const formData = new FormData()
      formData.append('perfumeId', perfume.id)
      formData.append('action', 'add')
      formData.append('isPublic', isPublic.toString())

      // Optimistically update the UI first
      setInWishlist(true)
      setShowWishlistForm(false)

      try {
        await updateWishlistAPI(formData)
      } catch {
        revertWishlistState()
      }
    }

    return (
      <div className="grid grid-cols-1 gap-2 noir-border relative p-4">
        {!showWishlistForm ? (
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
        ) : (
          <div className="space-y-2 p-3 bg-noir-dark/10 rounded-lg border">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`public-${perfume.id}`}
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <label htmlFor={`public-${perfume.id}`} className="text-sm text-noir-gold">
                Make public (show on trader profile)
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddToWishlist}
                variant='icon'
                background='gold'
                size={'sm'}
                className="flex-1"
              >
                Add to Wishlist
              </Button>
              <Button
                onClick={() => setShowWishlistForm(false)}
                variant='icon'
                background='gray'
                size={'sm'}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
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
                  url={`/admin/perfume/${perfume.slug}/edit`}
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
