import { formatPrice } from "~/utils/numberUtils"

const GeneralDetails = ({ userPerfume }: { userPerfume: any }) => {
  console.log('Rendering GeneralDetails for:', userPerfume)
  return (
    <div className="flex gap-8 mt-6">
      {userPerfume.placeOfPurchase &&
        <p className="font-medium flex flex-col justify-start items-start min-w-[30ch]">
          <span className='text-xl'>Point Of Purchase:</span>
          <span className='text-2xl'>{userPerfume.placeOfPurchase}</span>
        </p>
      }
      {userPerfume.price &&
        <p className='flex flex-col items-start justify-start'>
          <span className='text-lg'>Purchased at:</span>
          <span className='text-xl'>{formatPrice(userPerfume.price)}</span>
        </p>
      }
    </div>
  )
}

export default GeneralDetails
