import { expect, test } from 'vitest'

import { singlePropDirective } from '../../src/directives/single-prop'
import { ref } from '../../src/reactivity/ref'
import { sref } from '../../src/reactivity/sref'
import { bindDirective } from '../directive-test-utils'

const makeParseResult = (
  valuesRef: any,
  refs: any[],
  context: Record<string, unknown>,
) =>
  ({
    value: valuesRef,
    stop: () => {},
    refs,
    context,
  }) as any

test('single-prop returns no-op unbinder when option is missing', () => {
  const parseResult = makeParseResult(sref([1]), [], {})
  const unbind = bindDirective(
    singlePropDirective,
    document.createElement('div'),
    parseResult,
    'expr',
    undefined,
    undefined,
    undefined,
    { runInitialUpdate: true, observeValueRef: true },
  )
  expect(typeof unbind).toBe('function')
  expect(() => unbind()).not.toThrow()
})

test('single-prop assigns non-ref values into ref target', () => {
  const target = ref('x')
  const valuesRef = sref(['y'])
  const parseResult = makeParseResult(valuesRef, [], { model: target })

  bindDirective(
    singlePropDirective,
    document.createElement('div'),
    parseResult,
    'expr',
    'model',
    undefined,
    undefined,
    { runInitialUpdate: true, observeValueRef: true },
  )

  expect(target()).toBe('y')
})

test('single-prop assigns non-ref values into plain target', () => {
  const valuesRef = sref([7])
  const ctx: Record<string, unknown> = { model: 1 }
  const parseResult = makeParseResult(valuesRef, [], ctx)

  const unbind = bindDirective(
    singlePropDirective,
    document.createElement('div'),
    parseResult,
    'expr',
    'model',
    undefined,
    undefined,
    { runInitialUpdate: true, observeValueRef: true },
  )

  expect(ctx.model).toBe(7)
  unbind()
})

test('single-prop creates bridge for ref source and keeps sync', () => {
  const source = ref('a')
  const valuesRef = sref([0])
  const refs: any[] = [source]
  const ctx: Record<string, unknown> = {}
  const parseResult = makeParseResult(valuesRef, refs, ctx)

  const unbind = bindDirective(
    singlePropDirective,
    document.createElement('div'),
    parseResult,
    'expr',
    'model',
    undefined,
    undefined,
    { runInitialUpdate: true, observeValueRef: true },
  )

  const bridge = ctx.model as any
  expect(typeof bridge).toBe('function')
  expect(bridge()).toBe('a')

  source('b')
  expect(bridge()).toBe('b')

  refs[0] = undefined
  valuesRef(['c'] as never)
  expect(source()).toBe('c')

  unbind()
})

test('single-prop no-ops when forwarded bridge is already assigned', () => {
  const source = ref('a')
  const valuesRef = sref([0])
  const refs: any[] = [source]
  const ctx: Record<string, unknown> = {}
  const parseResult = makeParseResult(valuesRef, refs, ctx)

  const unbind1 = bindDirective(
    singlePropDirective,
    document.createElement('div'),
    parseResult,
    'expr',
    'model',
    undefined,
    undefined,
    { runInitialUpdate: true, observeValueRef: true },
  )
  const bridge = ctx.model

  refs[0] = bridge
  const unbind2 = bindDirective(
    singlePropDirective,
    document.createElement('div'),
    parseResult,
    'expr',
    'model',
    undefined,
    undefined,
    { runInitialUpdate: true, observeValueRef: true },
  )

  expect(ctx.model).toBe(bridge)
  unbind2()
  unbind1()
})

test('single-prop assigns forwarded bridge to plain ctx keys', () => {
  const source = ref('a')
  const valuesRef = sref([0])
  const refs: any[] = [source]
  const ctx: Record<string, unknown> = {}
  const parseResult = makeParseResult(valuesRef, refs, ctx)
  const unbind1 = bindDirective(
    singlePropDirective,
    document.createElement('div'),
    parseResult,
    'expr',
    'model',
    undefined,
    undefined,
    { runInitialUpdate: true, observeValueRef: true },
  )
  const bridge = ctx.model

  refs[0] = bridge
  ctx.model = 1
  const unbind2 = bindDirective(
    singlePropDirective,
    document.createElement('div'),
    parseResult,
    'expr',
    'model',
    undefined,
    undefined,
    { runInitialUpdate: true, observeValueRef: true },
  )
  expect(ctx.model).toBe(bridge)

  unbind2()
  unbind1()
})

test('single-prop entangles forwarded bridge with existing ref target', () => {
  const source = ref('a')
  const valuesRef = sref([0])
  const refs: any[] = [source]
  const firstCtx: Record<string, unknown> = {}
  const firstParseResult = makeParseResult(valuesRef, refs, firstCtx)
  const unbind1 = bindDirective(
    singlePropDirective,
    document.createElement('div'),
    firstParseResult,
    'expr',
    'model',
    undefined,
    undefined,
    { runInitialUpdate: true, observeValueRef: true },
  )
  const bridge = firstCtx.model as any

  const target = ref('t0')
  const secondCtx: Record<string, unknown> = { model: target }
  const secondParseResult = makeParseResult(valuesRef, [bridge], secondCtx)
  const unbind2 = bindDirective(
    singlePropDirective,
    document.createElement('div'),
    secondParseResult,
    'expr',
    'model',
    undefined,
    undefined,
    { runInitialUpdate: true, observeValueRef: true },
  )

  bridge('t1')
  expect(target()).toBe('t1')
  target('t2')
  expect(bridge()).toBe('t2')

  unbind2()
  unbind1()
})

test('single-prop reuses bridge and skips re-entangle for same source', () => {
  const source1 = ref('a')
  const source2 = ref('b')
  const valuesRef = sref([0])
  const refs: any[] = [source1]
  const ctx: Record<string, unknown> = {}
  const parseResult = makeParseResult(valuesRef, refs, ctx)
  const unbind = bindDirective(
    singlePropDirective,
    document.createElement('div'),
    parseResult,
    'expr',
    'model',
    undefined,
    undefined,
    { runInitialUpdate: true, observeValueRef: true },
  )

  const bridge = ctx.model as any
  const bridgeBefore = bridge

  valuesRef([1] as never)
  expect(ctx.model).toBe(bridgeBefore)

  refs[0] = source2
  valuesRef([2] as never)
  expect(ctx.model).toBe(bridgeBefore)
  expect(bridge()).toBe('b')

  unbind()
})
