import { PrismaClient } from "../generated/prisma"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const seedDb = async () => {
  const email = "test@here.com"
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  })
  const hashedPassword = await bcrypt.hash("AFairWellToKings", 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword
        }
      }
    }
  })

  await prisma.note.create({
    data: {
      title: "My first note",
      body: "Hello, world!",
      userId: user.id
    }
  })
}

await prisma.feature.create({
  data: {
    summary: "Feature 1",
    detail: "This is the first feature"
  }
})

seedDb()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
