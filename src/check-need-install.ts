import * as core from '@actions/core'
import {env} from 'process'
import {check} from './check'
import {convertPkg} from './handle_comment'
import {isFlutterPackage} from './util'
import * as fs from 'fs'

async function run(): Promise<void> {
  try {
    await check(packageType)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function writeEnvFile(key: string, value: string): void {
  fs.appendFileSync(env['GITHUB_OUTPUT'] || '', `\n${key}=${value}`)
}

async function packageType(commentBody: string): Promise<void> {
  const pkg = convertPkg(commentBody)
  if (!pkg) {
    throw new Error(`${commentBody} cannot be converted to a package`)
  }

  const subPath = pkg.subpath
  const isFlutter = isFlutterPackage(subPath)
  core.info(
    `Package ${pkg.name} is a ${isFlutter ? 'Flutter' : 'Dart'} package`
  )

  const isFlutterEnv = isFlutter ? 1 : 0

  writeEnvFile('IS_FLUTTER', isFlutterEnv.toString())
  writeEnvFile('PACKAGE_NAME', pkg.name)
  writeEnvFile('PACKAGE_VERSION', pkg.version)
  writeEnvFile('PACKAGE_SUBPATH', subPath)

  writeEnvFile('RELEASE_TAG', `${pkg.name}: v${pkg.version}`)
}

run()
