import {
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
  useLoaderData,
} from "react-router"
import { Link } from "react-router"

import { getUserReviews } from "~/models/perfumeReview.server"
import { authenticateUser } from "~/utils/server/auth.server"
import { sanitizeReviewHtml } from "~/utils/sanitize"

export const ROUTE_PATH = "/my-reviews"

export const meta: MetaFunction = () => [
  { title: "My Reviews - New Smell" },
  { name: "description", content: "View and manage your perfume reviews" },
]

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const authResult = await authenticateUser(request)

  if (!authResult.success || !authResult.user) {
    throw redirect("/login")
  }

  const user = authResult.user

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get("page") || "1", 10)
  const limit = parseInt(url.searchParams.get("limit") || "10", 10)

  const reviewsData = await getUserReviews(user.id, { page, limit })

  return {
    user,
    reviews: reviewsData.reviews,
    pagination: reviewsData.pagination,
  }
}

const MyReviewsPage = () => {
  const { user, reviews, pagination } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-noir-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-noir-gold mb-2">My Reviews</h1>
            <p className="text-gray-300">
              Manage your perfume reviews and share your thoughts with the community.
            </p>
          </div>

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map(review => (
                <div
                  key={review.id}
                  className="bg-white/5 border border-gray-300 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Link
                        to={`/perfume/${review.perfume.slug}`}
                        className="text-xl font-semibold text-noir-gold hover:text-noir-gold/80 transition-colors"
                      >
                        {review.perfume.name}
                      </Link>
                      <p className="text-sm text-gray-400">
                        by {review.perfume.perfumeHouse?.name}
                      </p>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("en-US")}
                    </div>
                  </div>

                  <div
                    className="prose prose-sm max-w-none text-gray-300 mb-4"
                    dangerouslySetInnerHTML={{ __html: sanitizeReviewHtml(review.review) }}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Link
                        to={`/perfume/${review.perfume.slug}`}
                        className="px-3 py-1 text-sm bg-noir-gold/20 text-noir-gold rounded hover:bg-noir-gold/30 transition-colors"
                      >
                        View Perfume
                      </Link>
                      <button className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                        Edit Review
                      </button>
                      <button className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors">
                        Delete Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  {pagination.hasPrevPage && (
                    <Link
                      to={`/my-reviews?page=${pagination.page - 1}`}
                      className="px-4 py-2 bg-noir-gold/20 text-noir-gold rounded hover:bg-noir-gold/30 transition-colors"
                    >
                      Previous
                    </Link>
                  )}

                  <span className="text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  {pagination.hasNextPage && (
                    <Link
                      to={`/my-reviews?page=${pagination.page + 1}`}
                      className="px-4 py-2 bg-noir-gold/20 text-noir-gold rounded hover:bg-noir-gold/30 transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-semibold text-gray-300 mb-2">
                No Reviews Yet
              </h2>
              <p className="text-gray-400 mb-6">
                You haven't written any reviews yet. Start sharing your thoughts
                about perfumes!
              </p>
              <Link
                to="/the-vault"
                className="px-6 py-3 bg-noir-gold text-noir-black rounded-lg hover:bg-noir-gold/90 transition-colors font-semibold"
              >
                Browse Perfumes
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyReviewsPage
