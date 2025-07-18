import type { ChangeEvent } from "react"

export const handleUploadCSV = async (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (!file) {
    return
  }
  const text = await file.text()
  const res = await fetch('/api/update-house-info', {
    method: 'POST',
    headers: { 'Content-Type': 'text/csv' },
    body: text
  })
  const result = await res.json()
  if (result.error) {
    alert('Error updating houses: ' + result.error)
  } else {
    alert('CSV uploaded! Updated: ' + result.results.length)
    window.location.reload()
  }
}
