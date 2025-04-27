/* eslint-disable @typescript-eslint/no-require-imports */
const { select } = require('@inquirer/prompts')
const pColor = require('picocolors')

const { componentName } = require('./utils/componentName.cjs')

select({
  choices: [
    {
      description: `${pColor.bgCyanBright('A single atom component')}`,
      name: 'Atom',
      value: 'Atoms'
    },
    {
      description: `${pColor.bgCyanBright('A group of Atoms')}`,
      name: 'Molecule',
      value: 'Molecules'
    },
    {
      description: `${pColor.bgCyanBright('A group of Molecules')}`,
      name: 'Organism',
      value: 'Organisms'
    }
  ],
  message: `${pColor.bgGreen('What type of component are you creating?')}`,
  theme: {
    icon: {
      cursor: '🛠️ '
    },
    style: {
      highlight: text => `${pColor.green(text)}`
    }
  }
}).then((type) => {
  componentName(type)
}).catch(console.error)
