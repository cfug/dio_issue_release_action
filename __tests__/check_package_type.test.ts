import {isFlutterPackage} from '../src/util'
import {beforeAll, expect, test} from '@jest/globals'
import shelljs from 'shelljs'

const dioUrl = 'https://github.com/cfug/dio.git'
const basePath = '/tmp/dio'

beforeAll(() => {
  shelljs.exec(`git clone ${dioUrl} ${basePath}`)
})

function getPubspecPath(subpath: string): string {
  return `${basePath}/${subpath}/pubspec.yaml`
}

test('check flutter type', () => {
  expect(isFlutterPackage(getPubspecPath('dio'))).toBeFalsy()
  expect(isFlutterPackage(getPubspecPath('plugins/cookie_manager'))).toBeFalsy()
  expect(isFlutterPackage(getPubspecPath('plugins/http2_adapter'))).toBeFalsy()
  expect(
    isFlutterPackage(getPubspecPath('plugins/native_dio_adapter'))
  ).toBeTruthy()
})
