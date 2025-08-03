import Papa from 'papaparse'






export const action = async ({ request }: { request: Request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
  }
  const text = await request.text()
  // Use PapaParse to parse CSV robustly
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
  if (parsed.errors && parsed.errors.length > 0) {
    return new Response(JSON.stringify({ error: 'CSV parse error', details: parsed.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  const rows = parsed.data as Record<string, string>[]
  const { getPerfumeHouseByName, createPerfumeHouse, updatePerfumeHouse } = await import('~/models/house.server')
  const results = []
  for (const row of rows) {
    // Check if house exists by id or name
    let houseId = row.id || ''
    let house = null
    if (houseId) {
      house = await getPerfumeHouseByName(row.name)
      // If id is present but does not match any record, treat as new
      if (!house || house.id !== houseId) {
        houseId = ''
      }
    } else if (row.name) {
      house = await getPerfumeHouseByName(row.name)
      houseId = house?.id ?? ''
    }

    // Prepare FormData, always omit 'id' for new house creation
    const formData = new FormData()
    Object.entries(row).forEach(([field, value]) => {
      if (field === 'id') {
        return
      } // Always skip id
      formData.append(field, value ?? '')
    })

    if (!houseId) {
      try {
        const createResult = await createPerfumeHouse(formData)
        // Add logging for creation result
        // eslint-disable-next-line no-console
        console.log('CREATE', formData.get('name'), createResult)
        if (createResult.success) {
          results.push({ name: formData.get('name'), status: 'created' })
        } else {
          results.push({ name: formData.get('name'), status: 'error', error: createResult.error })
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('CREATE ERROR', formData.get('name'), err)
        results.push({ name: formData.get('name'), status: 'error', error: String(err) })
      }
      continue
    }
    try {
      await updatePerfumeHouse(houseId, formData)
      // eslint-disable-next-line no-console
      console.log('UPDATE', formData.get('name'), houseId)
      results.push({ name: formData.get('name'), status: 'updated' })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('UPDATE ERROR', formData.get('name'), houseId, err)
      results.push({ name: formData.get('name'), status: 'error', error: String(err) })
    }
  }
  return new Response(JSON.stringify({ results }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
