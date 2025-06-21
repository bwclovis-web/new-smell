import csv from 'csv-parser'
import fs from 'fs'
import { parse } from 'json2csv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const inputPath = path.join(__dirname, '../csv/perfumes_shopsorce_updated.csv')
const outputPath = path.join(__dirname, '../csv/perfumes_shopsorce_updated.csv')

const rows = []

fs.createReadStream(inputPath)
  .pipe(csv())
  .on('data', row => {
    row.perfumeHouse = 'Sorce'
    rows.push(row)
  })
  .on('end', () => {
    const fields = Object.keys(rows[0])
    const opts = { fields }
    const csvData = parse(rows, opts)
    fs.writeFileSync(outputPath, csvData, 'utf8')
    console.log('Updated perfumeHouse to Sorce for all rows.')
  })
