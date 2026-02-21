import { expect, test } from 'vitest'
import {
  looseEqual,
  looseIndexOf,
  looseToNumber,
} from '../../src/common/looseEqual'

test('looseEqual compares values deeply', () => {
  expect(looseEqual(1, 1)).toBe(true)
  expect(looseEqual([1, 2], [1, 2])).toBe(true)
  expect(looseEqual([1, 2], [2, 1])).toBe(false)
  expect(looseEqual({ a: 1 }, { a: 1 })).toBe(true)
  expect(looseEqual({ a: 1 }, { a: 2 })).toBe(false)
  const date = new Date(0)
  expect(looseEqual(date, new Date(0))).toBe(true)
  const sym = Symbol('x')
  expect(looseEqual(sym, sym)).toBe(true)
})

test('looseIndexOf finds by loose comparison', () => {
  const arr = [1, { a: 2 }, [3]]
  expect(looseIndexOf(arr, { a: 2 })).toBe(1)
  expect(looseIndexOf(arr, [3])).toBe(2)
})

test('looseToNumber converts numeric strings', () => {
  expect(looseToNumber('10')).toBe(10)
  expect(looseToNumber('abc')).toBe('abc')
})
