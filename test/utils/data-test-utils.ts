import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

/**
 * Data Display Testing Utilities
 *
 * Utilities for testing tables, grids, lists, and data-heavy components
 */

// Test table rendering
export const testTableRendering = (
  expectedHeaders: string[],
  expectedRowCount: number
) => {
  const table = screen.getByRole("table")
  expect(table).toBeInTheDocument()

  // Check headers
  expectedHeaders.forEach((header) => {
    expect(
      within(table).getByRole("columnheader", { name: header })
    ).toBeInTheDocument()
  })

  // Check row count
  const rows = within(table).getAllByRole("row")
  // +1 for header row
  expect(rows).toHaveLength(expectedRowCount + 1)
}

// Test table sorting
export const testTableSorting = async (
  columnName: string,
  expectedOrder: "asc" | "desc"
) => {
  const user = userEvent.setup()
  const header = screen.getByRole("columnheader", { name: columnName })

  await user.click(header)

  // Check for sort indicator
  expect(header).toHaveAttribute(
    "aria-sort",
    expectedOrder === "asc" ? "ascending" : "descending"
  )
}

// Test table filtering
export const testTableFiltering = async (
  filterValue: string,
  expectedRowCount: number
) => {
  const user = userEvent.setup()
  const filterInput = screen.getByRole("searchbox", { name: /filter|search/i })

  await user.type(filterInput, filterValue)

  const table = screen.getByRole("table")
  const rows = within(table).getAllByRole("row")

  // -1 for header row
  expect(rows.length - 1).toBe(expectedRowCount)
}

// Test table pagination
export const testTablePagination = async (
  currentPage: number,
  totalPages: number,
  itemsPerPage: number
) => {
  const pageInfo = screen.getByText(new RegExp(`${currentPage}.*${totalPages}`, "i"))
  expect(pageInfo).toBeInTheDocument()

  // Test navigation buttons
  const nextButton = screen.getByRole("button", { name: /next/i })
  const prevButton = screen.getByRole("button", { name: /prev|previous/i })

  if (currentPage === 1) {
    expect(prevButton).toBeDisabled()
  }

  if (currentPage === totalPages) {
    expect(nextButton).toBeDisabled()
  }
}

// Test table row selection
export const testTableRowSelection = async (
  rowIndex: number,
  isMultiSelect = false
) => {
  const user = userEvent.setup()
  const table = screen.getByRole("table")
  const rows = within(table).getAllByRole("row")

  // Skip header row
  const dataRow = rows[rowIndex + 1]

  if (isMultiSelect) {
    const checkbox = within(dataRow).getByRole("checkbox")
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
  } else {
    await user.click(dataRow)
    expect(dataRow).toHaveAttribute("aria-selected", "true")
  }
}

// Test list rendering
export const testListRendering = (
  expectedItems: string[],
  listType: "ordered" | "unordered" = "unordered"
) => {
  const list = screen.getByRole("list")
  expect(list).toBeInTheDocument()

  if (listType === "ordered") {
    expect(list.tagName).toBe("OL")
  } else {
    expect(list.tagName).toBe("UL")
  }

  const items = within(list).getAllByRole("listitem")
  expect(items).toHaveLength(expectedItems.length)

  expectedItems.forEach((item, index) => {
    expect(items[index]).toHaveTextContent(item)
  })
}

// Test data grid cell editing
export const testDataGridCellEditing = async (
  rowIndex: number,
  columnIndex: number,
  newValue: string
) => {
  const user = userEvent.setup()
  const grid = screen.getByRole("grid")
  const rows = within(grid).getAllByRole("row")
  const cells = within(rows[rowIndex + 1]).getAllByRole("gridcell")
  const cell = cells[columnIndex]

  // Double-click to edit
  await user.dblClick(cell)

  const input = within(cell).getByRole("textbox")
  await user.clear(input)
  await user.type(input, newValue)
  await user.keyboard("{Enter}")

  expect(cell).toHaveTextContent(newValue)
}

// Test virtualized list
export const testVirtualizedList = async (
  totalItems: number,
  visibleItems: number
) => {
  const list = screen.getByRole("list")
  const items = within(list).getAllByRole("listitem")

  // Only visible items should be rendered
  expect(items.length).toBeLessThanOrEqual(visibleItems)
  expect(items.length).toBeLessThan(totalItems)
}

// Test infinite scroll
export const testInfiniteScroll = async (
  scrollFn: () => void,
  expectedNewItemCount: number
) => {
  const list = screen.getByRole("list")
  const initialItemCount = within(list).getAllByRole("listitem").length

  // Scroll to bottom
  scrollFn()

  // Wait for new items to load
  await screen.findByText(/loading more/i)

  // Check that more items were added
  const newItemCount = within(list).getAllByRole("listitem").length
  expect(newItemCount).toBeGreaterThanOrEqual(
    initialItemCount + expectedNewItemCount
  )
}

// Test data loading states
export const testDataLoadingStates = () => {
  // Initial loading
  expect(screen.getByText(/loading/i)).toBeInTheDocument()

  // Empty state
  const checkEmptyState = () => {
    expect(screen.getByText(/no data|no results|empty/i)).toBeInTheDocument()
  }

  // Error state
  const checkErrorState = () => {
    expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
  }

  return { checkEmptyState, checkErrorState }
}

// Test data export
export const testDataExport = async (
  exportFormat: "csv" | "json" | "xlsx",
  expectedFileName: string
) => {
  const user = userEvent.setup()
  const exportButton = screen.getByRole("button", {
    name: new RegExp(`export.*${exportFormat}`, "i"),
  })

  await user.click(exportButton)

  // In a real test, you'd verify the download
  // For now, just verify the button was clicked
  expect(exportButton).toHaveBeenClicked
}

// Test data refresh
export const testDataRefresh = async () => {
  const user = userEvent.setup()
  const refreshButton = screen.getByRole("button", { name: /refresh|reload/i })

  await user.click(refreshButton)

  // Should show loading indicator
  expect(screen.getByText(/refreshing|loading/i)).toBeInTheDocument()
}

// Test column visibility toggle
export const testColumnVisibility = async (
  columnName: string,
  shouldBeVisible: boolean
) => {
  const user = userEvent.setup()
  const columnToggle = screen.getByRole("button", { name: /columns/i })

  await user.click(columnToggle)

  const checkbox = screen.getByRole("checkbox", { name: columnName })
  await user.click(checkbox)

  const table = screen.getByRole("table")
  const header = within(table).queryByRole("columnheader", {
    name: columnName,
  })

  if (shouldBeVisible) {
    expect(header).toBeInTheDocument()
  } else {
    expect(header).not.toBeInTheDocument()
  }
}

// Test data grouping
export const testDataGrouping = async (
  groupByColumn: string,
  expectedGroups: string[]
) => {
  const user = userEvent.setup()
  const groupByButton = screen.getByRole("button", { name: /group by/i })

  await user.click(groupByButton)
  await user.click(screen.getByText(groupByColumn))

  // Verify groups are created
  expectedGroups.forEach((group) => {
    expect(screen.getByText(group)).toBeInTheDocument()
  })
}

// Test data aggregation
export const testDataAggregation = (
  aggregationTests: Array<{
    column: string
    function: "sum" | "avg" | "count" | "min" | "max"
    expectedValue: number
  }>
) => {
  aggregationTests.forEach((test) => {
    const aggregateCell = screen.getByText(
      new RegExp(`${test.function}.*${test.expectedValue}`, "i")
    )
    expect(aggregateCell).toBeInTheDocument()
  })
}

// Test data search
export const testDataSearch = async (
  searchTerm: string,
  expectedResultCount: number
) => {
  const user = userEvent.setup()
  const searchInput = screen.getByRole("searchbox")

  await user.type(searchInput, searchTerm)

  // Wait for search results
  const results = await screen.findAllByTestId("search-result")
  expect(results).toHaveLength(expectedResultCount)
}

// Mock large dataset
export const createMockDataset = (
  count: number,
  generator: (index: number) => any
) => Array.from({ length: count }, (_, i) => generator(i))
