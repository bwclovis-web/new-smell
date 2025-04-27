/* eslint-disable @typescript-eslint/no-require-imports */
const { input } = require('@inquirer/prompts')
const pColor = require('picocolors')

const generateTemplate = require('./generateTemplate.cjs')

const nameFormat = new RegExp(/^((?:[\w-]+\/)*)([A-Z][\w-]+)$/)
const componentName = type => {
  input({
    message: `What is the name of the ${pColor.greenBright(pColor.bold(type))}?`,
    required: true
  }).then((name) => {
    const match = name.match(nameFormat)
    if (name.length < 3) {
      throw `⛔ ${pColor.bgRed(pColor.white('Name must be at least 3 characters long'))}`
    }
    if (!match) {
      throw `⛔ ${pColor.bgRed(pColor.white('Name must be in PascalCase'))}`
    }
    generateTemplate(name, type)
  }).catch(console.error)
}

module.exports = { componentName }
