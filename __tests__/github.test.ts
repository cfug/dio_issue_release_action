import {expect, test} from '@jest/globals'
import {Octokit} from '@octokit/rest'
import {env} from 'process'

test('Test publish release', async () => {
  const owner = 'Caijinglong'
  const repo = 'dio'

  const token = env.GITHUB_TOKEN

  const github = new Octokit({auth: `token ${token}`})

  const tag = 'dio-v5.0.1-dev.4'

  const {data, status} = await github.repos.createRelease({
    owner,
    repo,
    tag_name: tag,
    target_commitish: 'main'
  })

  console.log(`stutas: ${status}`)

  console.log(`data: ${JSON.stringify(data)}`)
})
