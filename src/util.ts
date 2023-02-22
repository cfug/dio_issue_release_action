import {getInput} from '@actions/core'
import {Octokit} from '@octokit/rest'

export function client(): Octokit {
  // Get the GitHub token from the environment
  const token = getInput('github-token')
  if (!token) {
    throw new Error('No token found, please set github-token input.')
  }
  const octokit = new Octokit({auth: `token ${token}`})

  return octokit
}
