import * as core from '@actions/core'
import * as semver from 'semver'
import fs from 'fs'
import {commitAndTag, releaseGithubVersion} from './util'

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
  const currentVersionChangelog = updateChangeLogAndGet(pkg)

  core.info(`Current version changelog:\n ${currentVersionChangelog}`)

  // TODO: commit and push
  const tag = `${pkg.name}-v${pkg.version}`
  commitAndTag(`commit by comment ${commentBody}`, tag)

  releaseGithubVersion(tag, currentVersionChangelog)
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
  core.info(`pubspec file: ${pubspecPath}`)
  // read pubspec.yaml file content
  const content = fs.readFileSync(pubspecPath, {
    encoding: 'utf-8',
    flag: 'r'
  })

  // update version
  const lines = content.split('\n')
  const newLines = Array<string>()
  for (let line of lines) {
    if (line.startsWith('version:')) {
      line = `version: ${pkg.version}`
    }
    newLines.push(line)
  }

  core.info(`new version: ${pkg.version}`)

  // write pubspec.yaml file content
  fs.writeFileSync(pubspecPath, newLines.join('\n'), {
    encoding: 'utf-8',
    flag: 'w'
  })

  core.info(`update pubspec.yaml file success`)
}
function updateChangeLogAndGet(pkg: Pkg): string {
  const changelogFile = `${pkg.subpath}/CHANGELOG.md`
  core.info(`change log file: ${changelogFile}`)
  const changelogContent = fs.readFileSync(changelogFile, {
    encoding: 'utf-8',
    flag: 'r'
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
        return `${v}\n## ${pkg.version}\n`
      } else {
        return v
      }
    })
    .join('\n')

  // write changelog file content

  fs.writeFileSync(changelogFile, newChangelogContent, {
    encoding: 'utf-8',
    flag: 'w'
  })

  return versionContent
}
