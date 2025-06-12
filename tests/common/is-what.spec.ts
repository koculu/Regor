import { expect, test } from 'vitest'
import {
  isFunction,
  isString,
  isUndefined,
  isNullOrUndefined,
  isNullOrWhitespace,
  isMap,
  isSet,
  isDate,
  isSymbol,
  isArray,
  isObject,
} from '../../src/common/is-what'

test('primitive type checks', () => {
  expect(isFunction(() => {})).toBe(true)
  expect(isFunction('x')).toBe(false)
  expect(isString('str')).toBe(true)
  expect(isString(2)).toBe(false)
  expect(isUndefined(undefined)).toBe(true)
  expect(isUndefined(null)).toBe(false)
})

test('null/undefined helpers', () => {
  expect(isNullOrUndefined(undefined)).toBe(true)
  expect(isNullOrUndefined(null)).toBe(true)
  expect(isNullOrUndefined('val')).toBe(false)

  expect(isNullOrWhitespace('')).toBe(true)
  expect(isNullOrWhitespace('   ')).toBe(true)
  expect(isNullOrWhitespace(null)).toBe(true)
  expect(isNullOrWhitespace('abc')).toBe(false)
})

test('object type helpers', () => {
  expect(isMap(new Map())).toBe(true)
  expect(isSet(new Set())).toBe(true)
  expect(isDate(new Date())).toBe(true)
  expect(isSymbol(Symbol('s'))).toBe(true)
  expect(isArray([1,2])).toBe(true)
  expect(isObject({})).toBe(true)
  expect(isObject(null)).toBe(false)
})
