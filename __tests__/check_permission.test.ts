import {expect, test} from '@jest/globals'
import {checkWriterPermission} from '../src/check'

test('Test permission', async () => {
  expect(await checkWriterPermission('cfug', 'dio', 'caijinglong')).toBeTruthy()
  expect(await checkWriterPermission('cfug', 'dio', 'ueman')).toBeTruthy()
  expect(await checkWriterPermission('cfug', 'dio', 'alexv525')).toBeTruthy()
  expect(await checkWriterPermission('cfug', 'dio', 'abc')).toBeFalsy()
})
