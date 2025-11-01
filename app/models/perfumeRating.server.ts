import { prisma } from "~/db.server"

export async function createPerfumeRating(data: {
  userId: string
  perfumeId: string
  longevity?: number | null
  sillage?: number | null
  gender?: number | null
  priceValue?: number | null
  overall?: number | null
}) {
  const rating = await prisma.userPerfumeRating.create({
    data: {
      userId: data.userId,
      perfumeId: data.perfumeId,
      longevity: data.longevity,
      sillage: data.sillage,
      gender: data.gender,
      priceValue: data.priceValue,
      overall: data.overall,
    },
  })

  return rating
}

export async function updatePerfumeRating(
  ratingId: string,
  updates: {
    longevity?: number | null
    sillage?: number | null
    gender?: number | null
    priceValue?: number | null
    overall?: number | null
  }
) {
  const updatedRating = await prisma.userPerfumeRating.update({
    where: { id: ratingId },
    data: updates,
  })

  return updatedRating
}

export async function getUserPerfumeRating(userId: string, perfumeId: string) {
  const rating = await prisma.userPerfumeRating.findFirst({
    where: {
      userId,
      perfumeId,
    },
  })

  return rating
}

export async function getPerfumeRatings(perfumeId: string) {
  const ratings = await prisma.userPerfumeRating.findMany({
    where: { perfumeId },
  })

  // Calculate averages
  const categories = [
    "longevity",
    "sillage",
    "gender",
    "priceValue",
    "overall",
  ] as const
  const averages: Record<string, number | null> = {}

  categories.forEach(category => {
    const validRatings = ratings
      .map(rating => rating[category])
      .filter((value): value is number => value !== null)

    if (validRatings.length > 0) {
      const sum = validRatings.reduce((acc, val) => acc + val, 0)
      averages[category] = Math.round((sum / validRatings.length) * 10) / 10
    } else {
      averages[category] = null
    }
  })

  return {
    userRatings: ratings,
    averageRatings: {
      longevity: averages.longevity,
      sillage: averages.sillage,
      gender: averages.gender,
      priceValue: averages.priceValue,
      overall: averages.overall,
      totalRatings: ratings.length,
    },
  }
}

export async function deletePerfumeRating(ratingId: string): Promise<void> {
  await prisma.userPerfumeRating.delete({
    where: { id: ratingId },
  })
}
