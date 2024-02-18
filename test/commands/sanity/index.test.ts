import {test} from '@oclif/test'

describe('Trigger Sanity', () => {
  test
  .stderr()
  .command(['sanity'])
  .catch(/Missing required flag config/)  
  .it('runs sanity without config')
})
