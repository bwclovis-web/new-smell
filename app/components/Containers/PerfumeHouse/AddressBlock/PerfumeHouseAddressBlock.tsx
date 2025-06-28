const PerfumeHouseAddressBlock = ({ perfumeHouse }) => (
  <address className="flex flex-col  md:flex-row items-center gap-4 border mb-16 py-2 rounded-md bg-noir-dark text-noir-light px-2 my-6">
    <div className="md:w-1/2 w-full">
      {perfumeHouse.address && <p className="text-sm">
        <span className="font-medium text-lg">Address: </span>
        {perfumeHouse.address}
      </p>}
      {perfumeHouse.country && <p className="text-sm">
        <span className="font-medium text-lg">Country:</span>
        {' '}
        {perfumeHouse.country}
      </p>}
    </div>
    <div className="md:w-1/2 w-full">
      {perfumeHouse.email && <p className="text-sm">
        <span className="font-medium text-lg">Email:</span>
        {' '}
        {perfumeHouse.email}
      </p>}
      {perfumeHouse.phone && <p className="text-sm">
        <span className="font-medium text-lg">Phone:</span>
        {' '}
        {perfumeHouse.phone}
      </p>}
      {perfumeHouse.website && <p className="text-sm">
        <span className="font-medium text-lg">Website:</span>
        {' '}
        <a href={perfumeHouse.website} target="_blank" rel="noopener noreferrer">
          {perfumeHouse.website}
        </a>
      </p>}
    </div>
  </address>
)

export default PerfumeHouseAddressBlock
