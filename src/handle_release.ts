import * as core from '@actions/core'

export function releasePkg(commentBody: string): void {
  core.info(`Comment body: ${commentBody}`)
}
