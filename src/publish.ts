import * as core from '@actions/core'
import fs from 'fs'
import {Pkg} from './handle_comment'
import {isFlutterPackage} from './util'
import shelljs from 'shelljs'

export function installPublishEnv(): void {
  installPubAuthJson()
}

function installPubAuthJson(): void {
  const authJson = core.getInput('pub-credentials-json')
  if (authJson) {
    const home = process.env.HOME
    const targetDir = `${home}/.config/dart`
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, {recursive: true})
    }
    const jsonFile = `${targetDir}/pub-credentials.json`

    fs.writeFileSync(jsonFile, authJson)
    core.info(`The pub-credentials.json already created in ${jsonFile}.`)
    core.info(`The file length: ${fs.statSync(jsonFile).size} bytes.`)
  } else {
    core.error(
      'No pub-credentials-json input, please set it in workflow yaml file.'
    )
    throw new Error('No pub-credentials-json input')
  }
}

export async function publishPkg(pkg: Pkg, dryRun: boolean): Promise<void> {
  const subPath = pkg.subpath
  const isFlutter = isFlutterPackage(subPath)

  const suffixFlag = dryRun ? '--dry-run' : '--force'

  if (isFlutter) {
    core.info(`Package ${pkg.name} is a Flutter package`)
    const cmd = `flutter pub publish ${suffixFlag}`

    const result = shelljs.exec(cmd, {
      cwd: subPath
    })

    if (result.code !== 0) {
      throw new Error(`Commit failed: ${result.stderr}`)
    }
  }
}
