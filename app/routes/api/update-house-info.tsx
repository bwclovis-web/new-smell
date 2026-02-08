import Papa from "papaparse"

import { ErrorHandler } from "~/utils/errorHandling"

export const action = async ({ request }: { request: Request }) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }
  const text = await request.text()
  // Use PapaParse to parse CSV robustly
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
  if (parsed.errors && parsed.errors.length > 0) {
    return new Response(
      JSON.stringify({ error: "CSV parse error", details: parsed.errors }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
  const rows = parsed.data as Record<string, string>[]
  const { getPerfumeHouseByName, createPerfumeHouse, updatePerfumeHouse } =
    await import("~/models/house.server")

  // Valid HouseType values
  const validHouseTypes = [
"niche", "designer", "indie", "celebrity", "drugstore"
]

  // Helper function to validate and clean row data
  const validateRow = (row: Record<string, string>) => {
    const cleaned = { ...row }

    // Clean and validate name
    if (!cleaned.name || cleaned.name.trim() === "") {
      return { valid: false, error: "Name is required" }
    }
    cleaned.name = cleaned.name.trim()

    // Validate and clean type
    if (cleaned.type && !validHouseTypes.includes(cleaned.type.toLowerCase())) {
      // Set to default if invalid
      cleaned.type = "indie"
    } else if (cleaned.type) {
      cleaned.type = cleaned.type.toLowerCase()
    }

    // Clean other string fields
    Object.keys(cleaned).forEach(key => {
      if (typeof cleaned[key] === "string") {
        cleaned[key] = cleaned[key].trim()
      }
    })

    return { valid: true, data: cleaned }
  }

  const results = []
  for (const row of rows) {
    // Validate row data
    const validation = validateRow(row)
    if (!validation.valid) {
      results.push({
        name: row.name || "Unknown",
        status: "error",
        error: validation.error,
      })
      continue
    }

    const cleanedRow = validation.data
    // Check if house exists by id or name
    let houseId = cleanedRow.id || ""
    let house = null
    if (houseId) {
      house = await getPerfumeHouseByName(cleanedRow.name)
      // If id is present but does not match any record, treat as new
      if (!house || house.id !== houseId) {
        houseId = ""
      }
    } else if (cleanedRow.name) {
      house = await getPerfumeHouseByName(cleanedRow.name)
      houseId = house?.id ?? ""
    }

    // Prepare FormData, always omit 'id' for new house creation
    const formData = new FormData()
    Object.entries(cleanedRow).forEach(([field, value]) => {
      if (field === "id") {
        return
      } // Always skip id
      formData.append(field, value ?? "")
    })

    if (!houseId) {
      try {
        const createResult = await createPerfumeHouse(formData)
        if (createResult.success) {
          results.push({ name: formData.get("name"), status: "created" })
        } else {
          ErrorHandler.handle(new Error(createResult.error), {
            api: "update-house-info",
            action: "create-failed",
            houseName: formData.get("name"),
          })
          results.push({
            name: formData.get("name"),
            status: "error",
            error: createResult.error,
          })
        }
      } catch (err) {
        ErrorHandler.handle(err, {
          api: "update-house-info",
          action: "create-error",
          houseName: formData.get("name"),
        })
        results.push({
          name: formData.get("name"),
          status: "error",
          error: String(err),
        })
      }
      continue
    }
    try {
      await updatePerfumeHouse(houseId, formData)
      results.push({ name: formData.get("name"), status: "updated" })
    } catch (err) {
      ErrorHandler.handle(err, {
        api: "update-house-info",
        action: "update-error",
        houseName: formData.get("name"),
        houseId,
      })
      results.push({
        name: formData.get("name"),
        status: "error",
        error: String(err),
      })
    }
  }
  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
