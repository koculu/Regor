import { expect, test } from 'vitest'

import { collectRefs, ref, silence, watchEffect } from '../../src'

// silence should prevent watchEffect from tracking refs

test('silence prevents tracking refs in watchEffect', () => {
  const r = ref(0)
  let calls = 0
  watchEffect(() => {
    calls++
    silence(() => r())
  })
  expect(calls).toBe(1)
  r.value = 1
  expect(calls).toBe(1)
})

// collectRefs should capture accessed refs and return value

test('collectRefs gathers refs and returns value', () => {
  const a = ref(1)
  const b = ref(2)
  const { value, refs } = collectRefs(() => a() + b())
  expect(value).toBe(3)
  expect(refs).toContain(a)
  expect(refs).toContain(b)
  expect(refs.length).toBe(2)
})

test('silence works when no collection frame exists', () => {
  const out = silence(() => 42)
  expect(out).toBe(42)
})

test('watchEffect supports empty effect, cleanup registration and stop', () => {
  const stopNoop = watchEffect(undefined as any)
  expect(() => stopNoop()).not.toThrow()

  const a = ref(1)
  let runs = 0
  const cleaned: number[] = []
  const stop = watchEffect((onCleanup) => {
    runs++
    const snapshot = a()
    onCleanup?.(() => cleaned.push(snapshot))
  })
  expect(runs).toBe(1)
  a(2)
  expect(runs).toBe(2)
  expect(cleaned).toContain(1)
  stop()
})

test('watchEffect collectRefs handles empty set', () => {
  const { value, refs } = collectRefs(() => 10)
  expect(value).toBe(10)
  expect(refs.length).toBe(0)
})
