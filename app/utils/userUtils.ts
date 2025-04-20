/* eslint-disable complexity */
import { User } from "@prisma/client"
import { useMatches } from "react-router";
import { useMemo } from "react"

export function useMatchesData(routeId: string):
  Record<string, unknown> | undefined {
  const matchingRoutes = useMatches()
  const route = useMemo(
    () => matchingRoutes.find(route => route.id === routeId),
    [matchingRoutes, routeId]
  )
  return route?.data as Record<string, unknown>
}

const isUser = (user: unknown) => (
  user !== null &&
  typeof user === "object" &&
  "email" in user &&
  typeof user.email === "string"
)

export const useOptionalUser = (): User | undefined => {
  const data = useMatchesData("root")
  if (!data || !isUser(data.user)) {
    return undefined
  }
  return data.user as User
}
