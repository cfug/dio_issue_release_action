import * as core from '@actions/core'
import * as semver from 'semver'
import fs from 'fs'

interface Pkg {
  name: string
  version: string
  subpath: string
}

export function handleComment(commentBody: string): void {
  core.info(`Comment body: ${commentBody}`)

  const pkg = convertPkg(commentBody)
  if (!pkg) {
    core.info('Comment body is not a package, exiting')
    return
  }

  core.info(`Package info:`)
  core.info(`  name: ${pkg.name}`)
  core.info(`  version: ${pkg.version}`)
  core.info(`  subpath: ${pkg.subpath}`)
  core.info(`Start handle it`)

  updatePubspecVersion(pkg)
  updateChangeLogAndGet(pkg)
}

const _packagesMapping: {
  [key: string]: string
} = {
  dio: 'dio',
  cookie_manager: 'plugins/cookie_manager',
  http2_adapter: 'plugins/http2_adapter',
  native_dio_adapter: 'plugins/native_dio_adapter'
}

function checkVersion(version: string): boolean {
  return semver.valid(version) != null
}

function checkName(name: string): boolean {
  return name in _packagesMapping
}

/**
 *
 * The body like: `dio: v1.0.0` or `dio: 1.0.0`
 *
 * @param body The comment body
 *
 * @returns The package name, version and subpath
 */
export function convertPkg(body: string): Pkg | null {
  const regex = /(.*):\s*v*(.*)/
  const match = body.match(regex)
  core.info(`groups: ${match?.groups}`)

  if (match) {
    const name = match[1]
    const version = match[2]

    if (!checkName(name)) {
      core.info(
        `Package name ${name} is not supported, please use one of: ${Object.keys(
          _packagesMapping
        ).join(', ')}`
      )
      return null
    }

    if (!checkVersion(version)) {
      core.info(
        `Package version ${version} is not supported, please use semver format`
      )
      return null
    }

    const subpath = _packagesMapping[name]

    if (!subpath) {
      core.info(`Package ${name} is not supported`)
      return null
    }

    return {
      name,
      version,
      subpath
    }
  } else {
    return null
  }
}

function updatePubspecVersion(pkg: Pkg): void {
  const pubspecPath = `${pkg.subpath}/pubspec.yaml`
  // read pubspec.yaml file content
  const content = fs.readFileSync(pubspecPath, {
    encoding: 'utf-8',
    flag: 'r'
  })

  let outputContent = ``

  // update version
  const lines = content.split('\n')
  for (let line of lines) {
    if (line.startsWith('version:')) {
      line = `version: ${pkg.version}`
    }
    outputContent += `${line}\n`
  }

  // write pubspec.yaml file content
  fs.writeFileSync(pubspecPath, outputContent, {encoding: 'utf-8', flag: 'w'})
}
function updateChangeLogAndGet(pkg: Pkg): string {
  const changelogFile = `${pkg.subpath}/CHANGELOG.md`
  const changelogContent = fs.readFileSync(changelogFile, {
    encoding: 'utf-8',
    flag: 'w'
  })

  const lines = changelogContent.split('\n')
  let startIndex = -1
  let endIndex = -1

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    if (line.startsWith('##') && line.includes('Unreleased')) {
      startIndex = index
    } else if (startIndex !== -1 && line.startsWith('##')) {
      endIndex = index
      break
    }
  }

  const versionContent = lines.slice(startIndex + 1, endIndex).join('\n')

  // update changelog info
  const newChangelogContent = lines
    .map((v, index) => {
      if (index === startIndex + 1) {
        return `${v}\n\n- ${pkg.version}`
      } else {
        return v
      }
    })
    .join('\n')

  fs.writeFileSync(changelogFile, newChangelogContent, {
    encoding: 'utf-8',
    flag: 'w'
  })

  return versionContent
}
