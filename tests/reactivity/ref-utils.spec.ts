import { expect, test } from 'vitest'
import { ref, sref, isRef, isDeepRef, unref } from '../../src'

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
