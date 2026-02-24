import { expect, test } from 'vitest'

import { useScope } from '../../src'
import {
  getScope,
  peekScope,
  popScope,
  pushScope,
  setScope,
} from '../../src/composition/stack'
import { isScope } from '../../src/composition/useScope'

test('peekScope supports noThrow and throws without scope by default', () => {
  expect(peekScope(true)).toBeUndefined()
  expect(() => peekScope()).toThrow()
})

test('setScope merges mounted/unmounted hooks into existing context scope', () => {
  const ctx = {} as any

  pushScope()
  const base = peekScope() as any
  base.onMounted.push(() => {})
  base.onUnmounted.push(() => {})
  setScope(ctx)
  popScope()

  pushScope()
  const next = peekScope() as any
  next.onMounted.push(() => {})
  next.onUnmounted.push(() => {})
  setScope(ctx)
  popScope()

  const stored = getScope(ctx)
  expect(stored.onMounted.length).toBe(2)
  expect(stored.onUnmounted.length).toBe(2)
})

test('setScope returns early when existing scope is current scope', () => {
  const ctx = {} as any
  const cs = pushScope()
  setScope(ctx)
  expect(() => setScope(ctx)).not.toThrow()
  expect(getScope(ctx)).toBe(cs)
  popScope()
})

test('popScope can assign scope to provided context and isScope guards primitives', () => {
  const ctx = {} as any
  pushScope()
  popScope(ctx)
  expect(getScope(ctx)).toBeTruthy()

  const scope = useScope(() => ({ a: 1 }))
  expect(isScope(scope)).toBe(true)
  expect(isScope(1 as any)).toBe(false)
})
