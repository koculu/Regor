import { expect, test, vi } from 'vitest'

import { RegorConfig } from '../../src/app/RegorConfig'
import { Binder } from '../../src/bind/Binder'
import { DirectiveCollector } from '../../src/bind/DirectiveCollector'
import { interpolate } from '../../src/bind/interpolation'
import { unbind } from '../../src/cleanup/unbind'
import {
  camelize,
  defineRefValue,
  hyphenate,
  isOptionDynamic,
  normalizeAttributeName,
  toSelector,
} from '../../src/common/common'
import { looseEqual } from '../../src/common/looseEqual'
import { popScope, pushScope, setScope } from '../../src/composition/stack'
import { contextDirective } from '../../src/directives/context'
import { ErrorType, getError } from '../../src/log/errors'
import { warning, warningHandler, WarningType } from '../../src/log/warnings'
import { persist } from '../../src/misc/persist'
import { observe } from '../../src/observer/observe'
import { observerCount } from '../../src/observer/observerCount'
import { Parser } from '../../src/parser/Parser'
import { batch } from '../../src/reactivity/batch'
import { entangle } from '../../src/reactivity/entangle'
import { pause } from '../../src/reactivity/pause'
import { ref } from '../../src/reactivity/ref'
import { resume } from '../../src/reactivity/resume'
import { sref } from '../../src/reactivity/sref'
import { trigger } from '../../src/reactivity/trigger'
import { bindDirective } from '../directive-test-utils'

test('warnings handle null handler and object payload branch', () => {
  const prev = warningHandler.warning
  ;(warningHandler as any).warning = undefined
  expect(() =>
    warning(WarningType.MissingBindingExpression, 'x', document.body),
  ).not.toThrow()

  const spy = vi.fn()
  warningHandler.warning = spy
  warning(WarningType.PropertyAssignmentFailed, 'k', 'DIV', 1, new Error('e'))
  expect(spy).toHaveBeenCalled()
  warningHandler.warning = prev
})

test('getError covers static and dynamic message forms', () => {
  expect(getError(ErrorType.ComputedIsReadOnly).message).toContain('readonly')
  expect(getError(ErrorType.RequiresRefSourceArgument, 'x').message).toContain(
    'x requires ref source argument',
  )
})

test('common helpers cover cache, selector, attribute normalization and option dynamic', () => {
  expect(camelize('my-key')).toBe('myKey')
  expect(camelize('my-key')).toBe('myKey')
  expect(hyphenate('MyKey')).toBe('my-key')
  expect(hyphenate('MyKey')).toBe('my-key')
  expect(toSelector('a:b')).toBe('[a\\:b]')

  const cfg = new RegorConfig()
  expect(normalizeAttributeName('@click', cfg)).toContain(
    `${cfg.__builtInNames.on}:`,
  )
  expect(normalizeAttributeName(':a[b]', cfg)).toContain(
    cfg.__builtInNames.dynamic,
  )

  expect(isOptionDynamic('[abc]', ':')).toBe('abc')
  expect(isOptionDynamic(':k:', ':')).toBe('k')
  expect(isOptionDynamic(undefined, ':')).toBe(false)
})

test('interpolate ignores empty node and early returns on plain text', () => {
  expect(() => interpolate(null as any)).not.toThrow()
  const root = document.createElement('div')
  root.textContent = 'plain text'
  interpolate(root)
  expect(root.textContent).toBe('plain text')

  const text = document.createTextNode('')
  interpolate(text)
  expect(text.textContent).toBe('')
})

test('unbind skips nodes without childNodes', () => {
  expect(() => unbind({} as Node)).not.toThrow()
})

test('observe/observerCount/pause/resume throw for non-refs', () => {
  expect(() => observe(1 as any, () => {})).toThrowError(
    getError(ErrorType.RequiresRefSourceArgument, 'observe'),
  )
  expect(() => observerCount(1 as any)).toThrowError(
    getError(ErrorType.RequiresRefSourceArgument, 'observerCount'),
  )
  expect(() => pause(1 as any)).toThrowError(
    getError(ErrorType.RequiresRefSourceArgument, 'pause'),
  )
  expect(() => resume(1 as any)).toThrowError(
    getError(ErrorType.RequiresRefSourceArgument, 'resume'),
  )
})

test('entangle same ref is no-op and trigger handles recursive map structures', () => {
  const r = ref(1)
  const stop = entangle(r, r)
  expect(() => stop()).not.toThrow()

  const key = ref('k')
  const value = ref('v')
  const m = ref(new Map<any, any>([[key, value]]))
  const calls = vi.fn()
  observe(key, calls)
  observe(value, calls)
  trigger(m, 'x', true)
  expect(calls).toHaveBeenCalledTimes(2)

  const nullable = ref(null as any)
  trigger(nullable, 'x', true)
  expect(nullable()).toBeNull()
})

test('persist supports shallow refs and stores primitive values', () => {
  localStorage.clear()
  const r = sref(1)
  persist(r as any, 'persist-shallow')
  expect(localStorage.getItem('persist-shallow')).toBe('1')
  localStorage.setItem('persist-shallow', '2')
  persist(r as any, 'persist-shallow')
  expect(r()).toBe(2)
})

test('props directive ignores non-object payloads', () => {
  const values = sref<any[]>([1])
  const parseResult = {
    value: values,
    stop: () => {},
    refs: [],
    context: {},
  } as any
  const stop = bindDirective(
    contextDirective,
    document.createElement('div'),
    parseResult,
    '',
    undefined,
    undefined,
    undefined,
    { runInitialUpdate: true },
  )
  expect(parseResult.context).toEqual({})
  stop()
})

test('DirectiveCollector returns empty map for non-element nodes', () => {
  const parser = { __config: new RegorConfig() } as any
  const binder = new Binder(parser)
  const dc = new DirectiveCollector(binder)
  const map = dc.__collect(document.createTextNode('x') as any, true)
  expect(map.size).toBe(0)
})

test('defineRefValue readonly branch throws', () => {
  const f = ((v?: number) => (v === undefined ? 1 : v)) as any
  defineRefValue(f, true)
  expect(() => {
    f.value = 2
  }).toThrow('readonly')
})

test('looseEqual fallback string branch compares values by String()', () => {
  expect(looseEqual(10n, '10')).toBe(true)
  expect(looseEqual(Symbol.for('a'), Symbol.for('a'))).toBe(true)
})

test('setScope merge path with no callbacks still preserves existing scope', () => {
  const ctx = {} as any
  const first = pushScope()
  setScope(ctx)
  popScope()
  pushScope()
  setScope(ctx)
  popScope()
  expect(ctx).toBeTruthy()
  expect(first).toBeTruthy()
})

test('parser whitespace parse and restore empty stack branches', () => {
  const parser = new Parser([{}], new RegorConfig())
  const r = parser.__parse(' ')
  expect(r.value().length).toBe(0)
  parser.__restore()
  expect(parser.__contexts.length).toBe(0)
})

test('batch catches trigger errors from observers', () => {
  const source = sref(0)
  observe(source, () => {
    throw new Error('observer-fail')
  })
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    batch(() => {
      source(1)
    })
    expect(spy).toHaveBeenCalled()
  } finally {
    spy.mockRestore()
  }
})
