import * as core from '@actions/core'
import {check} from './check'
import {releasePkg} from './handle_release'

async function run(): Promise<void> {
  try {
    await check(releasePkg)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
