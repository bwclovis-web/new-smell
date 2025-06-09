import type { FC } from 'react'
import { BsHearts } from 'react-icons/bs'
import { GrEdit } from 'react-icons/gr'
import { MdDeleteForever } from 'react-icons/md'
import { NavLink } from 'react-router'

interface Perfume {
  name: string
  // add other properties as needed
}

interface PerfumeIconsProps {
  perfume: Perfume
  handleDelete: () => void
  userRole: string
}

const PerfumeIcons: FC<PerfumeIconsProps>
  = ({ perfume, handleDelete, userRole }) => (
    <div className="flex gap-4 items-center">
      <button onClick={() => handleDelete()} aria-label={`add ${perfume.name} to favorites`} className="bg-white/60 hover:bg-white/90 rounded-full p-2 cursor-pointer border-2 border-red-600/60 hover:border-red-600/90 transition-all duration-300 ease-in-out">
        <BsHearts size={40} fill="red" />
      </button>
      {userRole === 'admin'
        && (
          <>
            <NavLink
              aria-label={`edit ${perfume.name}`}
              viewTransition
              to={`/admin/perfume/${perfume.name}/edit`}
              className="bg-blue-600/60 p-3 hover:bg-blue-600/90 text-white rounded-full  flex items-center justify-center border-2 border-blue-600/60 hover:border-blue-600 transition-all duration-300 ease-in-out"
            >
              <GrEdit size={32} fill="white" />
            </NavLink>
            <button onClick={() => handleDelete()} aria-label={`delete ${perfume.name}`} className="bg-red-600/60 hover:bg-red-600/90 rounded-full p-2 cursor-pointer border-2 border-red-600/60 hover:border-red-600/90 transition-all duration-300 ease-in-out">
              <MdDeleteForever size={40} fill="white" />
            </button>
          </>
        )}
    </div>
  )

export default PerfumeIcons
