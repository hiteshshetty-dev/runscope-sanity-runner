import { Command, Flags } from '@oclif/core'

import { getConfig, transformConfig } from '../../lib/util/index.js'
import runTest from '../../lib/util/triggerSanity.js'

export default class SanityTrigger extends Command {
  static args = {}

  static description = 'This command helps users to trigger runscope tests and send slack messages.'

  static examples = [
    `$ trigger sanity --config="./config.json"`,
  ]

  static flags = {
    config: Flags.file({ char: 'c', description: 'Path to config file', required: true })
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(SanityTrigger)
    const config = await getConfig(flags.config)
    if(config){
      await runTest(transformConfig(config))
    }
  }
}
