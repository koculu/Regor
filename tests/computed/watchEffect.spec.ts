import { expect, test } from 'vitest'
import { watchEffect, silence, collectRefs, ref } from '../../src'

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
