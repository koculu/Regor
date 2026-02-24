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
  expect(looseEqual([1], [1, 2])).toBe(false)
  expect(looseEqual({ a: 1 }, { a: 1 })).toBe(true)
  expect(looseEqual({ a: 1 }, { a: 2 })).toBe(false)
  expect(looseEqual({ a: 1 }, { b: 1 })).toBe(false)
  const date = new Date(0)
  expect(looseEqual(date, new Date(0))).toBe(true)
  expect(looseEqual(date, 0)).toBe(false)
  const sym = Symbol('x')
  expect(looseEqual(sym, sym)).toBe(true)
  expect(looseEqual(Symbol('x'), Symbol('x'))).toBe(false)
  expect(looseEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
})

test('looseEqual handles objects without native hasOwnProperty', () => {
  const a = Object.create(null)
  a.x = 1
  const b = Object.create(null)
  b.x = 1
  expect(looseEqual(a, b)).toBe(true)

  const c = { x: 1, hasOwnProperty: 1 as any }
  const d = { x: 1, hasOwnProperty: 1 as any }
  expect(looseEqual(c, d)).toBe(true)
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
