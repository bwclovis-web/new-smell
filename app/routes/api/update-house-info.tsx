import { updatePerfumeHouse } from '~/models/house.server'



function cleanCsvField(raw: string): string {
  if (!raw) {
    return ''
  }
  let value = raw.trim()
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1)
  }
  return value
}

async function processCsvLine(fields: string[], values: string[], getPerfumeHouseByName: any) {
  const formData = new FormData()
  fields.forEach((field, i) => {
    formData.append(field, cleanCsvField(values[i] || ''))
  })
  // Prefer id, fallback to name
  const id = formData.get('id') as string
  let houseId = id
  if (!houseId) {
    const name = formData.get('name') as string
    const house = await getPerfumeHouseByName(name)
    houseId = house?.id ?? ''
  }
  if (!houseId) {
    return { name: formData.get('name'), status: 'error', error: 'House not found' }
  }
  try {
    await updatePerfumeHouse(houseId, formData)
    return { name: formData.get('name'), status: 'updated' }
  } catch (err) {
    return { name: formData.get('name'), status: 'error', error: String(err) }
  }
}

export const action = async ({ request }: { request: Request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
  }
  const text = await request.text()
  const lines = text.split(/\r?\n/).filter(Boolean)
  const [header, ...dataLines] = lines
  const fields = header.split(',')
  const { getPerfumeHouseByName } = await import('~/models/house.server')
  const results = []
  for (const line of dataLines) {
    const values = line.split(',')
    const result = await processCsvLine(fields, values, getPerfumeHouseByName)
    results.push(result)
  }
  return new Response(JSON.stringify({ results }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
