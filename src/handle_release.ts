import * as core from '@actions/core'

export function releasePkg(commentBody: string): void {
  core.info(`Comment body: ${commentBody}`)

  // check regex <pkg_name>: v<version>
  const regex = /(.*):\s*v(.*)/g
  const match = commentBody.match(regex)

  if (match) {
    const pkgName = match[1]
    const pkgVersion = match[2]

    core.info(`Package name: ${pkgName}`)
    core.info(`Package version: ${pkgVersion}`)
  } else {
    core.info(
      `Not supporte, the publish command should be in the format of <pkg_name>: v<version>`
    )
  }
}
