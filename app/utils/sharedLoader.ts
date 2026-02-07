import cookie from "cookie"
import { redirect } from "react-router"

import { getSessionFromRequest } from "~/utils/session-from-request.server"

const SIGN_IN_PATH = "/sign-in"

export const sharedLoader = async (request: Request) => {
  const session = await getSessionFromRequest(request, {
    includeUser: true,
    attemptRefresh: true,
  })

  if (!session) {
    throw redirect(SIGN_IN_PATH)
  }

  if (!session.user) {
    throw redirect(SIGN_IN_PATH)
  }

  if (session.newAccessToken) {
    const newAccessTokenCookie = cookie.serialize("accessToken", session.newAccessToken, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60, // 60 minutes
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
    throw redirect(request.url, {
      headers: {
        "Set-Cookie": newAccessTokenCookie,
      },
    })
  }

  return session.user
}
