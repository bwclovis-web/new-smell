import type { FC } from 'react'
import { useState } from 'react'
import { BsHeartFill, BsHearts } from 'react-icons/bs'
import { GrEdit } from 'react-icons/gr'
import { MdDeleteForever } from 'react-icons/md'
import { useFetcher } from 'react-router'

import { Button, VooDooLink } from '~/components/Atoms/Button/Button'
import AddToCollectionModal from '~/components/Organisms/AddToCollectionModal/AddToCollectionModal'

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
    const fetcher = useFetcher()

    const handleWishlistToggle = async () => {
      const formData = new FormData()
      formData.append('perfumeId', perfume.id)
      formData.append('action', inWishlist ? 'remove' : 'add')

      fetcher.submit(formData, {
        method: 'POST',
        action: '/api/wishlist'
      })
      setInWishlist(!inWishlist)
    }

    return (
      <div className="grid grid-cols-2 gap-4 items-center justify-items-center pt-4">
        <Button
          onClick={handleWishlistToggle}
          variant='icon'
          aria-label={`${inWishlist ? 'remove' : 'add'} ${perfume.name} ${inWishlist ? 'from' : 'to'} wishlist`}
          className="bg-white/60 hover:bg-white/90 focus:bg-white/90 border-red-600/60 hover:border-red-600/90"
        >

          {inWishlist
            ? (
              <div className="flex items-center gap-2">
                <span className="text-red-700 font-bold text-sm">In your wishlist</span>
                <BsHeartFill size={40} fill="red" />
              </div>
            )
            : (
              <div className="flex items-center gap-2">
                <span className="text-red-700 font-bold text-sm">Add to wishlist</span>
                <BsHearts size={40} fill="red" />
              </div>
            )}
        </Button>
        <AddToCollectionModal type="icon" perfume={perfume} />
        {userRole === 'admin'
          && (
            <>
              <VooDooLink
                aria-label={`edit ${perfume.name}`}
                variant="icon"
                url={`/admin/perfume/${perfume.name}/edit`}
                className="bg-blue-600/60 p-3 hover:bg-blue-600/90 text-white  border-blue-600/60 hover:border-blue-600 gap-6"
              >
                <span className="text-white/90 font-bold text-sm">Edit Perfume</span>
                <GrEdit size={32} fill="white" />
              </VooDooLink>
              <Button
                onClick={() => handleDelete()}
                aria-label={`delete ${perfume.name}`}
                variant="icon"
                background={'red'}
              >
                <span className="text-white/90 font-bold text-sm">Delete Perfume</span>
                <MdDeleteForever size={40} fill="white" />
              </Button>
            </>
          )}
      </div>
    )
  }

export default PerfumeIcons
