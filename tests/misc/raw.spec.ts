import { expect, test } from 'vitest'
import { isRaw, markRaw } from '../../src'

test('markRaw marks object', () => {
  const obj = markRaw({})
  expect(isRaw(obj)).toBe(true)
  expect(isRaw({})).toBe(false)
})
