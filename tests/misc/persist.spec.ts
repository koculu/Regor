import { expect, test } from 'vitest'
import { persist, ref } from '../../src'
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

// Validate that a key is required

test('should throw when key is empty', () => {
  const r = ref(1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(() => persist(r as any, '')).toThrowError(
    getError(ErrorType.PersistRequiresKey),
  )
})

