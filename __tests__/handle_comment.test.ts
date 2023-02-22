import {convertPkg} from '../src/handle_comment'
import {expect, test} from '@jest/globals'

test('convertPkg', () => {
  const pkg = convertPkg('dio: v1.0.0')
  expect('dio').toBe(pkg?.name)
  expect('1.0.0').toBe(pkg?.version)

  const pkg2 = convertPkg('dio: 1.0.0')
  expect('dio').toBe(pkg2?.name)
  expect('1.0.0').toBe(pkg2?.version)
})
