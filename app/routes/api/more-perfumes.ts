import type { LoaderFunctionArgs } from "react-router"

import { prisma } from "~/db.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const houseSlug = url.searchParams.get("houseSlug")
  const skip = parseInt(url.searchParams.get("skip") || "0", 10)
  const take = parseInt(url.searchParams.get("take") || "8", 10)

  if (!houseSlug) {
    return Response.json(
      {
        success: false,
        message: "House slug is required",
        perfumes: [],
      },
      { status: 400 }
    )
  }

  try {
    const house = await prisma.perfumeHouse.findUnique({
      where: { slug: houseSlug },
      select: {
        id: true,
        name: true,
      },
    })

    if (!house) {
      return Response.json(
        {
          success: false,
          message: "House not found",
          perfumes: [],
        },
        { status: 404 }
      )
    }

    const [perfumes, totalCount] = await Promise.all([
      prisma.perfume.findMany({
        where: { perfumeHouseId: house.id },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.perfume.count({
        where: { perfumeHouseId: house.id },
      }),
    ])

    const hasMore = skip + perfumes.length < totalCount
    return Response.json(
      {
        success: true,
        perfumes,
        meta: {
          houseName: house.name,
          skip,
          take,
          hasMore,
          count: perfumes.length,
          totalCount,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=600", // 10 minute cache
          "X-Data-Size": JSON.stringify(perfumes).length.toString(),
        },
      }
    )
  } catch {
    return Response.json(
      {
        success: false,
        message: "Failed to fetch perfumes",
        perfumes: [],
      },
      { status: 500 }
    )
  }
}
