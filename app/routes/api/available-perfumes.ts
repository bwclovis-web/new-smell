import { getAvailablePerfumesForDecanting } from "~/models/perfume.server"
import { withLoaderErrorHandling } from "~/utils/errorHandling.server"

export const loader = withLoaderErrorHandling(
  async () => {
    const availablePerfumes = await getAvailablePerfumesForDecanting()

    return Response.json(
      {
        success: true,
        perfumes: availablePerfumes,
        count: availablePerfumes.length,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300", // 5 minute cache
          "X-Data-Size": JSON.stringify(availablePerfumes).length.toString(),
        },
      }
    )
  },
  {
    context: { api: "available-perfumes", route: "api/available-perfumes" },
  }
)
