import { RiLogoutBoxRLine } from "react-icons/ri"

import { Button } from "~/components/Atoms/Button/Button"

const LogoutButton = () => (
  <form method="post" action="/api/log-out">
    <Button
      variant='icon'
      type="submit"
      className="bg-noir-light hover:bg-noir-dark hover:text-noir-light rounded-full p-2 transition-colors duration-300 text-noir-black"
    >
      <RiLogoutBoxRLine size={24} />
    </Button>
  </form>

)
export default LogoutButton
