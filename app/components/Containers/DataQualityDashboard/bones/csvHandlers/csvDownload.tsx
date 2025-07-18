const fields = [
  'id', 'name', 'description', 'image', 'website', 'country', 'founded', 'type', 'email', 'phone', 'address', 'createdAt', 'updatedAt'
]

type House = {
  [key: string]: any;
  id?: string;
  name?: string;
  type?: string;
  address?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

const getTypeField = (house: House): string => typeof house.type !== 'string' && house.name ? house.name ?? '' : house.type ?? ''

const getAddressField = (house: House): string => typeof house.address !== 'string' && house.address ? house.address ?? '' : house.type ?? ''

const getDateField = (value: string | Date | undefined): string => {
  if (!value) {
    return ''
  }
  return typeof value === 'string' ? value : new Date(value).toISOString()
}

const formatField = (field: string, house: House): string => {
  let val = ''
  switch (field) {
    case 'id':
      val = house.id ?? ''
      break
    case 'type':
      val = getTypeField(house)
      break
    case 'address':
      val = getAddressField(house)
      break
    case 'createdAt':
      val = getDateField(house.createdAt)
      break
    case 'updatedAt':
      val = getDateField(house.updatedAt)
      break
    default:
      if (Object.prototype.hasOwnProperty.call(house, field)) {
        val = house[field] ?? ''
      }
      break
  }
  // Escape quotes and wrap in quotes (Excel compatible)
  return `"${String(val).replace(/"/g, '""')}"`
}
// eslint-disable-next-line max-statements
export const handleDownloadCSV = async () => {
  const res = await fetch('/api/data-quality-houses')
  const response = await res.json()
  const houses = response.houses || []

  const rows = [fields]
  for (const house of houses) {
    rows.push(fields.map(field => formatField(field, house)))
  }
  const csvContent = rows.map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const aTag = document.createElement('a')
  aTag.href = url
  aTag.download = 'perfume_houses.csv'
  aTag.click()
  URL.revokeObjectURL(url)
}
