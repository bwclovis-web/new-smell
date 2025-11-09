/**
 * Central export point for all mutation hooks and utilities.
 */

// Wishlist mutations
export {
  useToggleWishlist,
  type WishlistActionParams,
  type WishlistResponse,
} from "./wishlist"

// Review mutations
export {
  type CreateReviewParams,
  type DeleteReviewParams,
  type ReviewResponse,
  type UpdateReviewParams,
  useCreateReview,
  useDeleteReview,
  useUpdateReview,
} from "./reviews"

// Rating mutations
export {
  type CreateOrUpdateRatingParams,
  type RatingCategory,
  type RatingResponse,
  useCreateOrUpdateRating,
  useCreateRating,
  useUpdateRating,
} from "./ratings"

// House mutations
export {
  type DeleteHouseParams,
  type DeleteHouseResponse,
  useDeleteHouse,
} from "./houses"

// Perfume mutations
export {
  type DeletePerfumeParams,
  type DeletePerfumeResponse,
  useDeletePerfume,
} from "./perfumes"

// Tag mutations
export {
  type CreateTagParams,
  type CreateTagResponse,
  useCreateTag,
} from "./tags"

