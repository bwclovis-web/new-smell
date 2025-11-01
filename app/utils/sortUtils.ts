export type SortOption =
  | "name-asc"
  | "name-desc"
  | "created-desc"
  | "created-asc"
  | "type-asc"

export interface SortConfig {
  sortBy: SortOption
  sortByType?: boolean
}

export interface FilterConfig {
  type?: string
  searchQuery?: string
}

export interface SortableItem {
  id: string
  name: string
  createdAt: Date
  type?: string
}

export const buildOrderBy = (sortBy: SortOption, sortByType?: boolean) => {
  if (sortBy) {
    switch (sortBy) {
      case "name-asc":
        return { name: "asc" }
      case "name-desc":
        return { name: "desc" }
      case "created-asc":
        return { createdAt: "asc" }
      case "created-desc":
        return { createdAt: "desc" }
      case "type-asc":
        return { type: "asc" }
      default:
        return { createdAt: "desc" }
    }
  }
  return sortByType ? { type: "asc" } : { createdAt: "desc" }
}

export const filterByType = (items: SortableItem[], type: string) => {
  if (!type || type === "all") {
    return items
  }
  return items.filter(item => item.type === type)
}

export const filterBySearchQuery = (items: SortableItem[], searchQuery: string) => {
  if (!searchQuery) {
    return items
  }
  const query = searchQuery.toLowerCase()
  return items.filter(item => item.name.toLowerCase().includes(query))
}

export const sortItems = <T extends SortableItem>(
  items: T[],
  sortBy: SortOption
): T[] => {
  const sortedItems = [...items]

  switch (sortBy) {
    case "name-asc":
      return sortedItems.sort((a, b) => a.name.localeCompare(b.name))
    case "name-desc":
      return sortedItems.sort((a, b) => b.name.localeCompare(a.name))
    case "created-asc":
      return sortedItems.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    case "created-desc":
      return sortedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    case "type-asc":
      return sortedItems.sort((a, b) => (a.type || "").localeCompare(b.type || ""))
    default:
      return sortedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
}

export const groupByFirstLetter = <T extends SortableItem>(items: T[]) => {
  const grouped: Record<string, T[]> = {}

  items.forEach(item => {
    const firstLetter = item.name.charAt(0).toUpperCase()
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = []
    }
    grouped[firstLetter].push(item)
  })

  // Sort the letters alphabetically
  return Object.keys(grouped)
    .sort()
    .reduce((acc, letter) => {
      acc[letter] = grouped[letter]
      return acc
    }, {} as Record<string, T[]>)
}

export const getAlphabetLetters = () => Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

export const getDefaultSortOptions = (t: (key: string) => string) => [
  {
    id: "created-desc",
    value: "created-desc",
    label: t("sortOptions.created-desc"),
    name: "sortBy",
    defaultChecked: true,
  },
  {
    id: "created-asc",
    value: "created-asc",
    label: t("sortOptions.created-asc"),
    name: "sortBy",
    defaultChecked: false,
  },
  {
    id: "name-asc",
    value: "name-asc",
    label: t("sortOptions.name-asc"),
    name: "sortBy",
    defaultChecked: false,
  },
  {
    id: "name-desc",
    value: "name-desc",
    label: t("sortOptions.name-desc"),
    name: "sortBy",
    defaultChecked: false,
  },
  {
    id: "type-asc",
    value: "type-asc",
    label: t("sortOptions.type-asc"),
    name: "sortBy",
    defaultChecked: false,
  },
]
