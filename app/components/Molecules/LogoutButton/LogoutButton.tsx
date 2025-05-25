const LogoutButton = () => (
  <form method="post" action="/api/log-out">
    <button
      type="submit"
      className="text-sm text-gray-500 hover:text-gray-800 underline"
    >
      Logout
    </button>
  </form>

)
export default LogoutButton
