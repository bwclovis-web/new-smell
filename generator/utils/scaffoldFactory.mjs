import fs from 'fs'
import path from 'path'
import pColor from 'picocolors'

const editLineEndings = str => str.replace(/\r|\n/gm, '\r\n')

const scaffoldFactory = (
  root,
  componentData,
  file
) => {
  const outputFie = path.join(root, file)
  if (fs.existsSync(outputFie)) {
    console.log('❌', pColor.bgRedBright((`Component ${file} already exists`)))
    return null
  }
  fs.mkdirSync(root, { recursive: true })
  fs.writeFileSync(outputFie, editLineEndings(componentData), 'utf8')
  console.log('🏗️', pColor.cyan(`Component ${file} scaffolded successfully`))
  return outputFie
}

export default scaffoldFactory
