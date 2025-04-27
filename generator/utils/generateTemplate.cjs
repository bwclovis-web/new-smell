/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable max-statements */
const path = require('path')
const pColor = require('picocolors')
const generateComponentTemplate = require('../templates/componentTemplate.cjs')
const generateVariantTemplate = require('../templates/variantTemplate.cjs')
const generateStoryTemplate = require('../templates/storyTemplate.cjs')
const generateViteTestTemplate = require('../templates/viteTestTemplate.cjs')
const scaffoldFactory = require('./scaffoldFactory.cjs')

const generateTemplate = (name, type) => {
  const lowerComponentName = name.toLocaleLowerCase()

  const componentPath = scaffoldFactory(
    path.join(`app/components/${type}`, name),
    generateComponentTemplate(name),
    `${name}.tsx`
  )

  const variantPath = scaffoldFactory(
    path.join(`app/components/${type}`, name),
    generateVariantTemplate(name),
    `${lowerComponentName}-variants.ts`
  )

  const viteTestPath = scaffoldFactory(
    path.join(`app/components/${type}`, name),
    generateViteTestTemplate(name),
    `${name}.test.tsx`
  )

  const storyPath = scaffoldFactory(
    `stories/${type}`,
    generateStoryTemplate(name, type),
    `${name}.stories.ts`
  )

  if (componentPath) {
    console.log('👍', pColor.green(`Component ${name} created successfully`))
    console.log('📁', pColor.bgGreenBright(`Component available in ${componentPath}`))
  }
  if (variantPath) {
    console.log('🎨', pColor.bgMagentaBright(`Variants available in ${variantPath}`))
  }
  if (storyPath) {
    console.log('📔', pColor.bgBlueBright(`Storybook Story available in ${storyPath}`))
  }
  if (viteTestPath) {
    console.log('🧪', pColor.bgYellowBright(`Vite test available in ${viteTestPath}`))
  }
  return true
}

module.exports = generateTemplate
