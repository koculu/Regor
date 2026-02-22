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

test('observeMany infers tuple source types in callback', () => {
  const label = ref('v1')
  const count = ref(2)
  const createdAt = ref(new Date('2025-01-01T00:00:00.000Z'))

  const calls: string[] = []
  const stop = observeMany([label, count, createdAt], ([l, c, d]) => {
    calls.push(`${l}:${c}:${d.getUTCFullYear()}`)
  }, true)

  expect(calls).toStrictEqual(['v1:2:2025'])

  label('v2')
  count(3)
  createdAt(new Date('2026-01-01T00:00:00.000Z'))

  expect(calls.at(-1)).toBe('v2:3:2026')
  stop()
})

test('observeMany stop prevents further callback execution', () => {
  const a = ref(1)
  const b = ref(10)
  const cb = vi.fn()
  const stop = observeMany([a, b], cb, true)

  expect(cb).toHaveBeenCalledTimes(1)

  stop()
  a(2)
  b(11)

  expect(cb).toHaveBeenCalledTimes(1)
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
