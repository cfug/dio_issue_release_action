import {getInput, info} from '@actions/core'
import {context} from '@actions/github'
import {Octokit} from '@octokit/rest'
import shelljs from 'shelljs'
import {Pkg} from './handle_comment'

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

export function commitAndTag(message: string, tag: string): void {
  commit(message)
  tagAndPush(tag)
}

function commit(message: string): shelljs.ShellString {
  const command = `git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
git config --global user.name "github-actions[bot]"
git add .
git commit -m "${message}"`

  const result = shelljs.exec(command)

  if (result.code !== 0) {
    throw new Error(`Commit failed: ${result.stderr}`)
  }

  return result
}
function tagAndPush(tag: string): void {
  const command = `git tag -a ${tag} -m "tag by comment"
git push origin --tags
git push origin main
`

  const result = shelljs.exec(command)

  throwShellError(result)
}

export async function releaseGithubVersion(
  changelog: string,
  tagName: string
): Promise<void> {
  const octokit = client()
  const {owner, repo} = context.repo

  const commentUrl = context.payload?.comment?.html_url

  const releaseBody = `
  ${changelog}
  
  Because of the [comment](${commentUrl}), this release was created by @${context.actor}.
  `

  const release = await octokit.repos.createRelease({
    owner,
    repo,
    tag_name: tagName,
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

  const tryRun = shelljs.exec(`cd ${subpath} && dart pub publish --dry-run`)

  throwShellError(tryRun)

  if (dryRun) {
    info('The dry-run is true, so the publish is skipped')
    return
  }

  const command = `cd ${subpath}
  dart pub publish --server=https://pub.dev --force
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
