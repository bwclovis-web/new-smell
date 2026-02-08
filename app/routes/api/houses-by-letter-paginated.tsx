import type { LoaderFunctionArgs } from "react-router"

import { getHousesByLetterPaginated } from "~/models/house.server"
import { ErrorHandler } from "~/utils/errorHandling"

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const letter = url.searchParams.get("letter")
  const houseType = url.searchParams.get("houseType") || "all"
  const skip = parseInt(url.searchParams.get("skip") || "0", 10)
  const take = parseInt(url.searchParams.get("take") || "16", 10)

  if (!letter || !/^[A-Za-z]$/.test(letter)) {
    return Response.json(
      {
        success: false,
        message: "Valid letter parameter is required",
        houses: [],
      },
      { status: 400 }
    )
  }

  try {
    const houses = await getHousesByLetterPaginated(letter.toUpperCase(), {
      skip,
      take,
      houseType,
    })

    return Response.json({
      success: true,
      houses: houses.houses,
      count: houses.count,
      meta: {
        letter,
        houseType,
        skip,
        take,
        hasMore: skip + houses.houses.length < houses.count,
        totalCount: houses.count,
      },
    })
  } catch (error) {
    const appError = ErrorHandler.handle(error, {
      api: "houses-by-letter-paginated",
      letter,
      houseType,
      skip,
      take,
    })
    return Response.json(
      {
        success: false,
        message: appError.userMessage,
        houses: [],
      },
      { status: 500 }
    )
  }
}
