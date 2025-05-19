const PerfumeHouseAddressBlock = ({ perfumeHouse }) => (
  <address className="flex items-center gap-4 border mb-16 py-2 rounded-md bg-noir-dark text-noir-light px-2 my-6">
    <div className="w-1/2">
      <p className="text-sm">
        <span className="font-medium text-lg">Address:</span>
        {' '}
        {perfumeHouse.address}
      </p>
      <p className="text-sm">
        <span className="font-medium text-lg">Country:</span>
        {' '}
        {perfumeHouse.country}
      </p>
    </div>
    <div>
      <p className="text-sm">
        <span className="font-medium text-lg">Email:</span>
        {' '}
        {perfumeHouse.email}
      </p>
      <p className="text-sm">
        <span className="font-medium text-lg">Phone:</span>
        {' '}
        {perfumeHouse.phone}
      </p>
      <p className="text-sm">
        <span className="font-medium text-lg">Website:</span>
        {' '}
        <a href={perfumeHouse.website} target="_blank" rel="noopener noreferrer">
          {perfumeHouse.website}
        </a>
      </p>
    </div>
  </address>
)

export default PerfumeHouseAddressBlock
