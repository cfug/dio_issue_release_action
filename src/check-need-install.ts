import * as core from '@actions/core'
import {check} from './check'
import {convertPkg} from './handle_comment'
import {isFlutterPackage, writeEnvFile} from './util'

async function run(): Promise<void> {
  try {
    await check(packageType)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
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
