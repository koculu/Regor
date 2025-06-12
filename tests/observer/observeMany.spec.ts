import { expect, test, vi } from 'vitest'
import { observeMany, observerCount, ref } from '../../src'
import { observe } from '../../src'

test('observeMany observes multiple refs', () => {
  const a = ref(1)
  const b = ref(2)
  const cb = vi.fn()
  const stop = observeMany([a, b], cb, true)
  expect(cb).toHaveBeenCalledWith([1, 2])
  a.value = 3
  b.value = 4
  expect(cb).toHaveBeenCalledTimes(3)
  stop()
})

test('observerCount tracks observers', () => {
  const r = ref(0)
  expect(observerCount(r)).toBe(0)
  const stop1 = observe(r, () => {})
  const stop2 = observe(r, () => {})
  expect(observerCount(r)).toBe(2)
  stop1()
  stop2()
  expect(observerCount(r)).toBe(0)
})
