import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "../../../../test/utils/test-utils"
import AdminNavigation from "./AdminNavigation"

describe("AdminNavigation", () => {
  it("renders a adminnavigation", () => {
    const user = { role: "admin" }
    renderWithProviders(<AdminNavigation user={user} />)
    expect(screen.getByText("create house")).toBeInTheDocument()
  })
})
