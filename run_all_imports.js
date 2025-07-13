import { spawn } from 'child_process'

const csvFiles = [
  'csv/bpal_enhanced_progress_1450.csv',
  'csv/perfumes_4160tuesdays_updated.csv',
  'csv/perfumes_akro_updated.csv',
  'csv/perfumes_blackcliff.csv',
  'csv/perfumes_luvmilk.csv',
  'csv/perfumes_navitus_updated.csv',
  'csv/perfumes_pnicolai.csv',
  'csv/perfumes_poesieperfume_updated.csv',
  'csv/perfumes_possets.csv',
  'csv/perfumes_sagegoddess.csv',
  'csv/perfumes_sarahbaker.csv',
  'csv/perfumes_scentsofwood_fixed.csv',
  'csv/perfumes_shopsorce_updated.csv',
  'csv/perfumes_strangesouth_updated.csv',
  'csv/perfumes_thoo.csv',
  'csv/perfumes_tiziana_terenzi.csv',
  'csv/perfumes_xerjoff.csv'
]

async function runImport(csvFile) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-console
    console.log(`Starting import of ${csvFile}...`)
    
    const child = spawn('node', ['perfume_import.js', csvFile], {
      stdio: 'inherit'
    })
    
    child.on('close', code => {
      if (code === 0) {
        // eslint-disable-next-line no-console
        console.log(`✅ Completed ${csvFile}`)
        resolve(csvFile)
      } else {
        // eslint-disable-next-line no-console
        console.error(`❌ Failed ${csvFile} with code ${code}`)
        reject(new Error(`Import failed with code ${code}`))
      }
    })
    
    child.on('error', reject)
  })
}

async function runAllImports() {
  // eslint-disable-next-line no-console
  console.log('🚀 Starting bulk import of all CSV files...')
  
  for (const csvFile of csvFiles) {
    try {
      await runImport(csvFile)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error importing ${csvFile}:`, error.message)
      // Continue with next file even if one fails
    }
  }
  
  // eslint-disable-next-line no-console
  console.log('🎉 All imports completed!')
}

runAllImports().catch(error => {
  // eslint-disable-next-line no-console
  console.error('Fatal error:', error)
  process.exit(1)
})
