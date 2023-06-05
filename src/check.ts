import * as core from '@actions/core'
import {context} from '@actions/github'
import {checkShellEnv, client, showCurrentBranchName} from './util'

export async function check(
  onSuccesss: (commentBody: string) => Promise<void>
): Promise<void> {
  // If the event is not issue_comment, exit
  if (context.eventName !== 'issue_comment') {
    core.info('Event is not issue_comment, exiting')
    return
  }

  checkShellEnv()

  // show current branch name
  showCurrentBranchName()

  // Get the issue comment body
  const comment = context.payload?.comment
  if (!comment) {
    core.info('Comment is empty, exiting')
    return
  }

  // Get the issue number
  const issueNumber = context.payload?.issue?.number
  if (!issueNumber) {
    core.info('Issue number is empty, exiting')
    return
  }

  // Get comment username
  const commentUsername = comment.user.login
  if (!commentUsername) {
    core.info('Comment username is empty, exiting')
    return
  }

  const {owner, repo} = context.repo

  if (!owner || !repo) {
    core.info('Owner or repo is empty, exiting')
    return
  }

  core.info(`Comment username: ${commentUsername}`)
  core.info(`Owner: ${owner}, Repo: ${repo}, Issue number: ${issueNumber}`)

  // Check the comment is from a collaborator
  if (!(await checkWriterPermission(owner, repo, commentUsername))) {
    return
  }
  await onSuccesss(`${comment.body}`.trim())
}

export async function checkWriterPermission(
  owner: string,
  repo: string,
  commentUsername: string
): Promise<boolean> {
  // Check commit user have write access
  const kit = client()
  const permissionLevel = await kit.repos.getCollaboratorPermissionLevel({
    owner,
    repo,
    username: commentUsername
  })

  if (permissionLevel.status !== 200) {
    core.info('Permission level is not 200, exiting')
    return false
  }

  const permissions = permissionLevel.data.user?.permissions

  if (!permissions) {
    core.info('Permissions is empty, exiting')
    return false
  }

  core.info(`Permissions: ${JSON.stringify(permissions)}`)

  if (permissions.admin || permissions.maintain) {
    return true
  }

  core.info('Permission is not allowed.')
  return false
}
