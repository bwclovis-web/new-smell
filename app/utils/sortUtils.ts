/* eslint-disable max-len */
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
  createdAt: Date | string
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

  const getTimeValue = (value: Date | string) => {
    if (value instanceof Date) {
      return value.getTime()
    }

    const parsed = new Date(value)
    const timestamp = parsed.getTime()
    return Number.isNaN(timestamp) ? 0 : timestamp
  }

  switch (sortBy) {
    case "name-asc":
      return sortedItems.sort((item1, item2) => item1.name.localeCompare(item2.name))
    case "name-desc":
      return sortedItems.sort((item1, item2) => item2.name.localeCompare(item1.name))
    case "created-asc":
      return sortedItems.sort((item1, item2) => getTimeValue(item1.createdAt) - getTimeValue(item2.createdAt))
    case "created-desc":
      return sortedItems.sort((item1, item2) => getTimeValue(item2.createdAt) - getTimeValue(item1.createdAt))
    case "type-asc":
      return sortedItems.sort((item1, item2) => (item1.type || "").localeCompare(item2.type || ""))
    default:
      return sortedItems.sort((item1, item2) => getTimeValue(item2.createdAt) - getTimeValue(item1.createdAt))
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
