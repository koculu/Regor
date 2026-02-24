import { expect, test } from 'vitest'

import { sref } from '../../src'
import { MountList } from '../../src/bind/MountList'

test('mount list preserves ordering through insert, replace, and removals', () => {
  const list = new MountList((v) => v)
  const i0 = sref(0)
  const i1 = sref(1)
  const i2 = sref(2)
  list.__push(MountList.__createItem(i0, 'a'))
  list.__push(MountList.__createItem(i1, 'b'))

  const inserted = MountList.__createItem(sref(99), 'x')
  list.__insertAt(1, inserted)
  expect(list.__get(0).order).toBe(0)
  expect(list.__get(1).value).toBe('x')
  expect(list.__get(1).order).toBe(1)
  expect(list.__get(2).order).toBe(2)

  const replaced = MountList.__createItem(i2, 'c')
  list.__replace(2, replaced)
  expect(list.__get(2).value).toBe('c')
  expect(list.__lookupValueOrderIfMounted('b')).toBe(-1)
  expect(list.__lookupValueOrderIfMounted('c')).toBe(2)

  list.__removeAt(1)
  expect(list.__length).toBe(2)
  expect(list.__get(1).order).toBe(1)
  expect(list.__lookupValueOrderIfMounted('x')).toBe(-1)

  list.__removeAllAfter(1)
  expect(list.__length).toBe(1)
  expect(list.__isValueMounted('a')).toBe(true)
  expect(list.__isValueMounted('c')).toBe(false)
})

test('mount list skips value map writes when computed key is undefined', () => {
  const list = new MountList((v) => (v === 'skip' ? undefined : v))
  list.__push(MountList.__createItem(sref(0), 'keep'))
  list.__push(MountList.__createItem(sref(1), 'skip'))

  expect(list.__isValueMounted('keep')).toBe(true)
  expect(list.__isValueMounted('skip')).toBe(false)
  expect(list.__lookupValueOrderIfMounted('skip')).toBe(-1)

  list.__removeAt(1)
  expect(list.__length).toBe(1)
})
