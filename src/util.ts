import {getInput, info} from '@actions/core'
import {context} from '@actions/github'
import {Octokit} from '@octokit/rest'
import shelljs from 'shelljs'

export function client(): Octokit {
  // Get the GitHub token from the environment
  const token = getInput('github-token')
  if (!token) {
    throw new Error('No token found, please set github-token input.')
  }
  const octokit = new Octokit({auth: `token ${token}`})

  return octokit
}

export function commitAndTag(message: string, tag: string): void {
  const checkGit = shelljs.which('git')
  if (!checkGit) {
    throw new Error('Git is not installed')
  }

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
`

  const result = shelljs.exec(command)

  if (result.code !== 0) {
    throw new Error(`Tag and push failed: ${result.stderr}`)
  }
}

export async function releaseGithubVersion(
  changelog: string,
  tagName: string
): Promise<void> {
  const octokit = client()
  const {owner, repo} = context.repo

  const release = await octokit.repos.createRelease({
    owner,
    repo,
    tag_name: tagName,
    name: tagName,
    body: changelog
  })

  if (release.status !== 201) {
    throw new Error(`Release version failed`)
  }
  info(`Release success: open ${release.data.html_url} to see it`)
}
