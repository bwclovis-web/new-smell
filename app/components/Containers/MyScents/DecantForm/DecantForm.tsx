import { Button } from "~/components/Atoms/Button/Button"

const DecantForm = ({ handleDecantConfirm }) => {
  console.log("DecantForm component rendered")
  return (
    <div className='mt-4'>
      <h3 className='text-lg font-semibold mb-2'>Decant Options</h3>
      <p className='text-sm text-gray-600'>Decanting allows you to share or transfer a portion of your fragrance to another bottle.</p>
      <p className='text-sm text-gray-600'>Please note that decanting is irreversible and will permanently change the amount of fragrance in your collection.</p>
      <Button onClick={handleDecantConfirm}>Confirm Decant</Button>
    </div>
  )
}
export default DecantForm
