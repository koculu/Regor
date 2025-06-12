import { expect, test, vi } from 'vitest'
import { persist, ref, warningHandler } from '../../src'
import { ErrorType, getError } from '../../src/log/errors'

const KEY = 'persist-key'

// Verify that persist saves and restores values from localStorage

test('should persist value changes and restore existing data', () => {
  localStorage.clear()
  const r1 = ref(1)
  persist(r1, KEY)
  expect(localStorage.getItem(KEY)).toBe('1')
  r1.value = 2
  expect(localStorage.getItem(KEY)).toBe('2')

  const r2 = ref(0)
  persist(r2, KEY)
  expect(r2.value).toBe(2)
})

test('should reset storage on invalid data', () => {
  localStorage.clear()
  localStorage.setItem(KEY, '[')
  const spy = vi.fn()
  const prev = warningHandler.warning
  warningHandler.warning = spy
  const r = ref(5)
  persist(r, KEY)
  expect(localStorage.getItem(KEY)).toBe('5')
  expect(r.value).toBe(5)
  expect(spy).toHaveBeenCalled()
  warningHandler.warning = prev
})

// Validate that a key is required

test('should throw when key is empty', () => {
  const r = ref(1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(() => persist(r as any, '')).toThrowError(
    getError(ErrorType.PersistRequiresKey),
  )
})

