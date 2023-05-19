import {
  checkName,
  checkVersionContentEmpty,
  convertPkg,
  convertPkgList
} from '../src/handle_comment'
import {expect, test} from '@jest/globals'

test('convertPkg', () => {
  const pkg = convertPkg('dio: v1.0.0')
  expect('dio').toBe(pkg?.name)
  expect('1.0.0').toBe(pkg?.version)

  const pkg2 = convertPkg('dio: 1.0.0')
  expect('dio').toBe(pkg2?.name)
  expect('1.0.0').toBe(pkg2?.version)

  expect(convertPkg('unknown: 1.0.0')).toBeNull()
  expect(convertPkg('dio: ')).toBeNull()

  expect(convertPkg('cookie_manager: 1.0.0')).toEqual({
    name: 'cookie_manager',
    version: '1.0.0',
    subpath: 'plugins/cookie_manager'
  })
})

test('convertPkgList', () => {
  const commentBody = `
    dio: v1.0.0
    cookie_manager: v1.0.0
  `

  const pkgList = convertPkgList(commentBody)
  expect(pkgList.length).toBe(2)
  expect(pkgList).toEqual([
    {
      name: 'dio',
      version: '1.0.0',
      subpath: 'dio'
    },
    {
      name: 'cookie_manager',
      version: '1.0.0',
      subpath: 'plugins/cookie_manager'
    }
  ])
})

test('check_change_log_change', () => {
  expect(() => checkVersionContentEmpty('*None.*')).toThrowError()
  expect(() => checkVersionContentEmpty('\n *None.* \n')).toThrowError()

  expect(() => checkVersionContentEmpty('')).toThrowError()
  expect(() => checkVersionContentEmpty(' ')).toThrowError()

  expect(() =>
    checkVersionContentEmpty(' - The version have change ')
  ).not.toThrowError()
})

test('checkName', () => {
  expect(checkName('dio')).toBe(true)
  expect(checkName('cookie_manager')).toBe(true)
  expect(checkName('http2_adapter')).toBe(true)
  expect(checkName('native_dio_adapter')).toBe(true)
  expect(checkName('unknown')).toBe(false)
})
