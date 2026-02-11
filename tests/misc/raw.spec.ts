import { expect, test } from 'vitest'

import { isRaw, markRaw, ref } from '../../src'

test('markRaw marks object and ref skips conversion', () => {
  const obj = { a: 1 }
  const rawObj = markRaw(obj)
  expect(isRaw(rawObj)).toBe(true)
  const r = ref(rawObj)
  expect(r).toBe(obj)
  expect(isRaw(r)).toBe(true)
})
