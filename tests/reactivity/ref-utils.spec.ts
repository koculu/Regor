import { expect, test } from 'vitest'
import {
  ref,
  isDeepRef,
  pause,
  resume,
  entangle,
  watchEffect,
  isRef,
  sref,
  unref,
  observe,
} from '../../src'

test('pause and resume', () => {
  const r = ref(1)
  let n = 0
  watchEffect(() => {
    r()
    n++
  })
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

test('unref unwraps refs and returns value', () => {
  const r = ref(2)
  const sr = sref(3)
  expect(unref(r)).toBe(2)
  expect(unref(sr)).toBe(3)
  expect(unref(4)).toBe(4)
})

test('isDeepRef distinguishes ref types', () => {
  const r = ref(1)
  const sr = sref(1)
  expect(isRef(r)).toBe(true)
  expect(isRef(sr)).toBe(true)
  expect(isDeepRef(r)).toBe(true)
  expect(isDeepRef(sr)).toBe(false)
  expect(isDeepRef(ref(1))).toBe(true)
  expect(isDeepRef(sref(1))).toBe(false)
  expect(isDeepRef({})).toBe(false)
})

test('pause and resume control reactivity', () => {
  const r = ref(0)
  let calls = 0
  observe(r, () => ++calls)
  r.value++
  expect(calls).toBe(1)
  pause(r)
  r.value++
  expect(calls).toBe(1)
  resume(r)
  r.value++
  expect(calls).toBe(2)
})

test('entangle syncs ref values', () => {
  const a = ref(1)
  const b = ref(2)
  const stop = entangle(a, b)
  expect(b.value).toBe(1)
  a.value = 3
  expect(b.value).toBe(3)
  b.value = 4
  expect(a.value).toBe(4)
  stop()
  a.value = 5
  expect(b.value).toBe(4)
})
