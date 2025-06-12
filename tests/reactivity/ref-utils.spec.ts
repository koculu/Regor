import { expect, test } from 'vitest'
import { ref, isDeepRef, pause, resume, entangle, watchEffect, isRef, sref, unref } from '../../src'

test('pause and resume', () => {
  const r = ref(1)
  let n = 0
  watchEffect(() => { r(); n++ })
  expect(n).toBe(1)
  pause(r)
  r(2)
  expect(n).toBe(1)
  resume(r)
  r(3)
  expect(n).toBe(2)
})

test('entangle syncs refs', () => {
  const r1 = ref(1)
  const r2 = ref(0)
  const stop = entangle(r1, r2)
  expect(r2()).toBe(1)
  r1(2)
  expect(r2()).toBe(2)
  r2(3)
  expect(r1()).toBe(3)
  stop()
  r1(4)
  expect(r2()).toBe(3)
})

test('isRef and isDeepRef recognition', () => {
  const r = ref(1)
  const sr = sref(1)
  expect(isRef(r)).toBe(true)
  expect(isRef(sr)).toBe(true)
  expect(isDeepRef(r)).toBe(true)
  expect(isDeepRef(sr)).toBe(false)
})

test('unref unwraps refs and returns value', () => {
  const r = ref(2)
  const sr = sref(3)
  expect(unref(r)).toBe(2)
  expect(unref(sr)).toBe(3)
  expect(unref(4)).toBe(4)
})
