import { useMutation, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "~/lib/queries/houses"
import { queryKeys as perfumeQueryKeys } from "~/lib/queries/perfumes"

export interface DeleteHouseParams {
  houseId: string
}

export interface DeleteHouseResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Delete a house mutation function.
 */
async function deleteHouse(
  params: DeleteHouseParams
): Promise<DeleteHouseResponse> {
  const { houseId } = params

  const response = await fetch(`/api/deleteHouse?id=${houseId}`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.error || errorData.message || "Failed to delete house"
    )
  }

  const result = await response.json()

  // API returns array, so we'll handle that
  return {
    success: Array.isArray(result) ? result.length > 0 : !!result,
  }
}

/**
 * Hook to delete a house with optimistic updates.
 * 
 * @example
 * ```tsx
 * const deleteHouse = useDeleteHouse()
 * deleteHouse.mutate({ houseId: "123" })
 * ```
 */
export function useDeleteHouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteHouse,
    onMutate: async (variables) => {
      const { houseId } = variables

      // Cancel outgoing refetches
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.houses.all }),
        queryClient.cancelQueries({ queryKey: perfumeQueryKeys.perfumes.all }),
      ])

      // Snapshot previous values for rollback
      const previousHouses = queryClient.getQueryData(queryKeys.houses.all)

      // Optimistically remove house from cache
      queryClient.setQueryData(queryKeys.houses.all, (old: any) => {
        if (!old) return old

        // Handle different query structures
        if (Array.isArray(old)) {
          return old.filter((house: any) => house.id !== houseId)
        }
        if (old.houses && Array.isArray(old.houses)) {
          return {
            ...old,
            houses: old.houses.filter((house: any) => house.id !== houseId),
          }
        }

        return old
      })

      return { previousHouses }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousHouses) {
        queryClient.setQueryData(queryKeys.houses.all, context.previousHouses)
      }
    },
    onSuccess: () => {
      // Invalidate all house queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.houses.all,
      })

      // Invalidate perfume queries (perfumes belong to houses)
      queryClient.invalidateQueries({
        queryKey: perfumeQueryKeys.perfumes.all,
      })
    },
  })
}

