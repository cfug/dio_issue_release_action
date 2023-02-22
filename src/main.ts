import * as core from '@actions/core'
import {check} from './check'
import {handleComment} from './handle_comment'

async function run(): Promise<void> {
  try {
    await check(handleComment)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
