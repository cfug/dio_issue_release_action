import {getInput, info} from '@actions/core'
import {context} from '@actions/github'
import {Octokit} from '@octokit/rest'
import shelljs from 'shelljs'
import {Pkg} from './handle_comment'
import fs from 'fs'
import Yaml from 'yaml'

export function client(): Octokit {
  // Get the GitHub token from the environment
  const token = getInput('github-token', {required: true})
  if (!token) {
    throw new Error('No token found, please set github-token input.')
  }
  const octokit = new Octokit({auth: `token ${token}`})

  return octokit
}

export function checkShellEnv(): void {
  const checkGit = shelljs.which('git')
  if (!checkGit) {
    throw new Error('Git is not installed')
  }

  const checkDart = shelljs.which('dart')
  if (!checkDart) {
    throw new Error('Dart is not installed')
  }
}

export function showCurrentBranchName(): void {
  const result = shelljs.exec('git rev-parse --abbrev-ref HEAD')
  throwShellError(result)

  info(`current git ref: ${result.stdout}`)
}

export function commitAndTag(message: string): void {
  commit(message)
  tagAndPush()
}

function commit(message: string): shelljs.ShellString {
  const command = `git config --global user.email "47591151+cfug-dev@users.noreply.github.com"
git config --global user.name "cfug-dev"
git add .
git commit -m "${message}"`

  const result = shelljs.exec(command)

  if (result.code !== 0) {
    throw new Error(`Commit failed: ${result.stderr}`)
  }

  return result
}
function tagAndPush(): shelljs.ShellString {
  // config token for push
  const token = getInput('github-token', {required: true})
  if (!token) {
    throw new Error('No token found, please set github-token input.')
  }

  // use gh to login and push
  const ghCommand = `echo "${token}" | gh auth login --with-token --hostname github.com -p https
  gh auth setup-git -h github.com
  `

  const command = `
${ghCommand}
git push origin main
`

  const result = shelljs.exec(command)

  throwShellError(result)

  return result
}

export async function releaseGithubVersion(
  tagName: string,
  releaseName: string,
  changelog: string
): Promise<void> {
  const octokit = client()
  const {owner, repo} = context.repo

  const releaseBody = `
  ## What's new
  ${changelog}
  `

  const release = await octokit.repos.createRelease({
    owner,
    repo,
    tag_name: tagName,
    name: releaseName,
    body: releaseBody,
    target_commitish: 'main'
  })

  if (release.status !== 201) {
    throw new Error(`Release version failed`)
  }
  info(`Release success: open ${release.data.html_url} to see it`)
}

export function publishToPub(pkg: Pkg): void {
  const credentialsJson = getInput('pub-credentials-json', {required: true})
  const dryRunInput = getInput('dry-run', {
    required: true,
    trimWhitespace: true
  })

  const dryRun = dryRunInput === 'true'

  if (!credentialsJson) {
    throw new Error(
      'No credentials found, please set pub-credentials-json input.'
    )
  }

  // Write credentials to the pub file
  if (!shelljs.test('-d', '~/.pub-cache')) {
    shelljs.mkdir('~/.pub-cache')
  }
  shelljs.exec(`echo '${credentialsJson}' > ~/.pub-cache/credentials.json`)

  const subpath = pkg.subpath
  const isFlutter = isFlutterPackage(`${subpath}/pubspec.yaml`)

  const publishCommand = isFlutter ? 'flutter pub publish' : 'dart pub publish'

  info(`The ${pkg.name} is a ${isFlutter ? 'flutter' : 'dart'} package`)
  info(`Use ${publishCommand} to publish`)

  const tryRun = shelljs.exec(`cd ${subpath} && ${publishCommand} --dry-run`)

  throwShellError(tryRun)

  if (dryRun) {
    info(
      'Because the input "dry-run" is true, so the publish to pub is skipped.'
    )
    return
  }

  const command = `cd ${subpath}
  ${publishCommand} --server=https://pub.dev --force
  `

  const result = shelljs.exec(command)

  throwShellError(result)

  info(
    `Publish success: open https://pub.dev/packages/${pkg.name}/versions/${pkg.version} to see the version`
  )
}

function throwShellError(result: shelljs.ShellString): void {
  if (result.code !== 0) {
    throw new Error(`Shell error: ${result.stderr}`)
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isFlutterPackage(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf8')
  const yaml = Yaml.parse(content)
  const environment = yaml.environment
  if (!environment) {
    return false
  }
  return !!environment.flutter
}

export function tryCheckFlutterEnv(pkg: Pkg): void {
  if (isFlutterPackage(`${pkg.subpath}/pubspec.yaml`)) {
    const flutterEnv = shelljs.which('flutter')
    if (!flutterEnv) {
      throw new Error(
        'The package is a flutter package, but flutter is not installed'
      )
    }
  }
}
