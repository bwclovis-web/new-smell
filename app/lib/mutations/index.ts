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
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  type CreateReviewParams,
  type UpdateReviewParams,
  type DeleteReviewParams,
  type ReviewResponse,
} from "./reviews"

// Rating mutations
export {
  useCreateOrUpdateRating,
  useCreateRating,
  useUpdateRating,
  type CreateOrUpdateRatingParams,
  type RatingCategory,
  type RatingResponse,
} from "./ratings"

// House mutations
export {
  useDeleteHouse,
  type DeleteHouseParams,
  type DeleteHouseResponse,
} from "./houses"

// Perfume mutations
export {
  useDeletePerfume,
  type DeletePerfumeParams,
  type DeletePerfumeResponse,
} from "./perfumes"

// Tag mutations
export {
  useCreateTag,
  type CreateTagParams,
  type CreateTagResponse,
} from "./tags"

