import { expect, test } from 'vitest'
import { observeMany, observerCount, ref } from '../../src'

test('observeMany reacts to multiple refs', () => {
  const a = ref(1)
  const b = ref(2)
  let vals: number[] = []
  const stop = observeMany([a, b], v => { vals = v }, true)
  expect(vals).toEqual([1,2])
  a(3)
  expect(vals).toEqual([3,2])
  b(5)
  expect(vals).toEqual([3,5])
  stop()
})

test('observerCount reflects observers', () => {
  const a = ref(0)
  expect(observerCount(a)).toBe(0)
  const stop = observeMany([a], () => {})
  expect(observerCount(a)).toBe(1)
  stop()
  expect(observerCount(a)).toBe(0)
})
