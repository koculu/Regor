import { expect, test } from 'vitest'

import { propsOnceDirective } from '../../src/directives/props-once'
import { ref } from '../../src/reactivity/ref'

const makeParseResult = (value: unknown, context: Record<string, unknown>) =>
  ({
    value: () => [value],
    stop: () => {},
    refs: [],
    context,
  }) as any

test('props-once is once and collects refs', () => {
  expect(propsOnceDirective.once).toBe(true)
  expect(propsOnceDirective.collectRefObj).toBe(true)
})

test('props-once does nothing for non-object value', () => {
  const ctx = { a: 1 }
  const unbind = propsOnceDirective.onBind!(
    document.createElement('div'),
    makeParseResult(123, ctx),
    'expr',
  )
  unbind()
  expect(ctx.a).toBe(1)
})

test('props-once assigns plain values to context keys', () => {
  const ctx: Record<string, unknown> = {}
  const unbind = propsOnceDirective.onBind!(
    document.createElement('div'),
    makeParseResult({ a: 1, b: 'x' }, ctx),
    'expr',
  )
  unbind()
  expect(ctx.a).toBe(1)
  expect(ctx.b).toBe('x')
})

test('props-once writes into existing ref keys', () => {
  const r = ref(0)
  const ctx: Record<string, unknown> = { a: r }
  propsOnceDirective.onBind!(
    document.createElement('div'),
    makeParseResult({ a: 9 }, ctx),
    'expr',
  )
  expect(r()).toBe(9)
})

test('props-once skips assignment when context value is strictly equal', () => {
  const shared = { v: 1 }
  let setCount = 0
  const ctx: Record<string, unknown> = {}
  Object.defineProperty(ctx, 'a', {
    configurable: true,
    enumerable: true,
    get: () => shared,
    set: () => {
      setCount++
    },
  })

  propsOnceDirective.onBind!(
    document.createElement('div'),
    makeParseResult({ a: shared }, ctx),
    'expr',
  )

  expect(setCount).toBe(0)
})
