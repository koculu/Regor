import { expect, test } from 'vitest'
import { flatten, markRaw, isRaw, html, raw, ref, sref } from '../../src'

test('flatten converts nested refs', () => {
  const obj = ref({ a: ref(1), b: { c: sref(2) } })
  expect(flatten(obj)).toStrictEqual({ a: 1, b: { c: 2 } })

  const arr = ref([ref(1), sref(2)])
  expect(flatten(arr)).toStrictEqual([1, 2])

  const set = ref(new Set([ref(3)]))
  expect(Array.from(flatten(set) as Set<any>)).toStrictEqual([3])

  const map = ref(new Map([['k', ref(4)]]))
  const flatMap = flatten(map) as Map<string, any>
  expect(flatMap.get('k')).toBeUndefined()
})

test('markRaw marks object as raw', () => {
  const obj = markRaw({ a: 1 })
  expect(isRaw(obj)).toBe(true)
  expect(isRaw({})).toBe(false)
})

test('html and raw tag helpers build strings', () => {
  const value = 'world'
  expect(html`hello ${value}`).toBe('hello world')
  expect(raw`a${1}b${2}`).toBe('a1b2')
})
