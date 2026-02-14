/**
 * Minimal perfume shape returned by recommendation services.
 * Keeps the interface stable so ML or other implementations can be swapped in.
 */
export interface RecommendationPerfume {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  perfumeHouse?: {
    id: string
    name: string
    slug: string
    type?: string
  } | null
}

/**
 * Recommendation service interface for similar and personalized perfumes.
 * Implementations: rules-based (note overlap), or future ML-based.
 */
export interface RecommendationService {
  getSimilarPerfumes(perfumeId: string, limit: number): Promise<RecommendationPerfume[]>
  getPersonalizedForUser(userId: string, limit: number): Promise<RecommendationPerfume[]>
}
