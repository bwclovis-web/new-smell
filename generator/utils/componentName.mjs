import { input } from '@inquirer/prompts'
import pColor from 'picocolors'

import generateTemplate from './generateTemplate.mjs'

const nameFormat = new RegExp(/^((?:[\w-]+\/)*)([A-Z][\w-]+)$/)
const componentName = type => {
  input({
    message: `What is the name of the ${pColor.greenBright(pColor.bold(type))}?`,
    required: true
  }).then(name => {
    const match = name.match(nameFormat)
    if (name.length < 3) {
      throw new Error(`⛔ ${pColor.bgRed(pColor.white('Name must be at least 3 characters long'))}`)
    }
    if (!match) {
      throw new Error(`⛔ ${pColor.bgRed(pColor.white('Name must be in PascalCase'))}`)
    }
    generateTemplate(name, type)
  }).catch(error => {
    console.error(error)
  })
}

export { componentName }
