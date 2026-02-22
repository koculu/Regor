import { expect, test } from 'vitest'

import { computeMany, ref, watchEffect } from '../../src'

test('computeMany computes lazily and caches until a source changes', () => {
  const a = ref(1)
  const b = ref(2)
  let calls = 0

  const sum = computeMany([a, b], (x, y) => {
    ++calls
    return x + y
  })

  expect(calls).toBe(0)
  expect(sum()).toBe(3)
  expect(calls).toBe(1)

  // no dependency change => cached result
  expect(sum()).toBe(3)
  expect(calls).toBe(1)

  a(5)
  expect(calls).toBe(1)
  expect(sum()).toBe(7)
  expect(calls).toBe(2)
})

test('computeMany uses latest source values after multiple changes before next read', () => {
  const a = ref(1)
  const b = ref(1)
  let calls = 0

  const sum = computeMany([a, b], (x, y) => {
    ++calls
    return x + y
  })

  expect(sum()).toBe(2)
  expect(calls).toBe(1)

  a(2)
  a(3)
  b(4)
  b(5)

  // recomputes once on next access with latest values
  expect(sum()).toBe(8)
  expect(calls).toBe(2)
})

test('computeMany notifies reactive consumers via watchEffect', () => {
  const a = ref(1)
  const b = ref(2)
  const sum = computeMany([a, b], (x, y) => x + y)
  const seen: number[] = []

  const stop = watchEffect(() => {
    seen.push(sum())
  })

  expect(seen).toStrictEqual([3])

  a(4)
  expect(seen).toStrictEqual([3, 6])

  b(10)
  expect(seen).toStrictEqual([3, 6, 14])

  stop()
})

test('computeMany infers and computes with mixed primitive types', () => {
  const name = ref('Alice')
  const age = ref(30)
  const active = ref(true)

  const summary = computeMany([name, age, active], (n, a, isActive) => {
    return `${n}-${a}-${isActive ? 'on' : 'off'}`
  })

  expect(summary()).toBe('Alice-30-on')

  age(31)
  active(false)
  expect(summary()).toBe('Alice-31-off')
})

test('computeMany infers Date sources and reacts to replacement', () => {
  const start = ref(new Date('2024-01-01T00:00:00.000Z'))
  const end = ref(new Date('2024-01-03T00:00:00.000Z'))

  const dayDiff = computeMany([start, end], (s, e) => {
    const msPerDay = 24 * 60 * 60 * 1000
    return Math.round((e.getTime() - s.getTime()) / msPerDay)
  })

  expect(dayDiff()).toBe(2)

  end(new Date('2024-01-06T00:00:00.000Z'))
  expect(dayDiff()).toBe(5)
})

test('computeMany infers tuple order for different source types', () => {
  const title = ref('Report')
  const count = ref(2)
  const createdAt = ref(new Date('2025-05-10T00:00:00.000Z'))

  const formatted = computeMany([title, count, createdAt], (t, c, d) => {
    return `${t}#${c}@${d.getUTCFullYear()}`
  })

  expect(formatted()).toBe('Report#2@2025')

  title('Summary')
  count(3)
  createdAt(new Date('2026-07-01T00:00:00.000Z'))
  expect(formatted()).toBe('Summary#3@2026')
})
