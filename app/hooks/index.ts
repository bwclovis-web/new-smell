// Existing hooks
export { default as useLetterSelection } from "./useLetterSelection"
export { useHouses } from "./useHouses"
export { useHousesByLetter } from "./useHousesByLetter"
export { usePerfumesByLetter } from "./usePerfumesByLetter"
export { useInfiniteHouses } from "./useInfiniteHouses"
export {
  useInfinitePerfumesByHouse,
  useInfinitePerfumesByLetter,
} from "./useInfinitePerfumes"
export { usePerfumeReviews } from "./usePerfumeReviews"
export { usePerfumeRatings } from "./usePerfumeRatings"
export { useWishlistStatus } from "./useWishlistStatus"
export { usePerfume } from "./usePerfume"
export { useHouse } from "./useHouse"
export { useTrader } from "./useTrader"

// New extracted hooks
export { default as useDebounce } from "./useDebounce"
export {
  useApiErrorHandler,
  useAsyncErrorHandler,
  useErrorHandler,
  useFormErrorHandler,
} from "./useErrorHandler"
export { default as useFormState } from "./useFormState"
export { default as useLocalStorage } from "./useLocalStorage"
export { default as useOptimisticUpdate } from "./useOptimisticUpdate"
export { default as usePasswordStrength } from "./usePasswordStrength"
export { default as useRatingSystem } from "./useRatingSystem"
export { default as useServerError } from "./useServerError"
export { default as useToggle } from "./useToggle"
