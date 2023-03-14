import {isFlutterPackage} from '../src/util'
import {beforeAll, expect, test} from '@jest/globals'
import shelljs from 'shelljs'

const dioUrl = 'https://github.com/cfug/dio.git'
const basePath = '/tmp/dio'

beforeAll(() => {
  shelljs.exec(`git clone ${dioUrl} ${basePath}`)
  process.env.GITHUB_WORKSPACE = basePath
})

test('check flutter type', () => {
  expect(isFlutterPackage('dio')).toBeFalsy()
  expect(isFlutterPackage('plugins/cookie_manager')).toBeFalsy()
  expect(isFlutterPackage('plugins/http2_adapter')).toBeFalsy()
  expect(isFlutterPackage('plugins/native_dio_adapter')).toBeTruthy()
})
