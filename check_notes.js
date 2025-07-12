/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function formatNotes(notes, noteType) {
  const noteList = notes.map(note => `    - ${note.name}`).join('\n')
  return `  ${noteType} notes:\n${noteList || '    - None'}`
}

async function getPerfume(perfumeName) {
  console.log(`Querying for perfume: ${perfumeName}`)
  const perfume = await prisma.perfume.findFirst({
    where: {
      name: {
        equals: perfumeName,
        mode: 'insensitive',
      },
    },
    include: {
      perfumeNotesOpen: true,
      perfumeNotesHeart: true,
      perfumeNotesClose: true,
    },
  })
  console.log('Query finished.')
  return perfume
}

async function generateOutput(perfumeName) {
  if (!perfumeName) {
    return 'Please provide a perfume name as an argument.'
  }

  console.log('Getting perfume data...')
  const perfume = await getPerfume(perfumeName)
  console.log('Perfume data received.')

  if (!perfume) {
    return `Perfume "${perfumeName}" not found.`
  }

  const output = [
    `Notes for "${perfume.name}":`,
    formatNotes(perfume.perfumeNotesOpen, 'Top'),
    formatNotes(perfume.perfumeNotesHeart, 'Heart'),
    formatNotes(perfume.perfumeNotesClose, 'Base'),
  ]
  return output.join('\n')
}

async function run() {
  console.log('Starting script...')
  const perfumeName = process.argv[2]
  const output = await generateOutput(perfumeName)
  console.log(output)
  console.log('Script finished.')
}

async function main() {
  try {
    await run()
  } catch (error) {
    console.error('Error in main:', error)
    process.exit(1)
  } finally {
    console.log('Disconnecting from database...')
    await prisma.$disconnect()
    console.log('Disconnected.')
  }
}

main()
  .catch(error => {
    console.error('Error checking perfume notes:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
