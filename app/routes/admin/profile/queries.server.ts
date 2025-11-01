import { prisma } from "~/db.server"

export async function updateUser(
  id: string,
  {
    firstName,
    lastName,
    username,
    email,
  }: {
    firstName: string
    lastName: string
    username: string
    email: string
  }
) {
  return prisma.user.update({
    where: { id },
    data: {
      firstName,
      lastName,
      username,
      email,
    },
  })
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  })
}
