import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { attachEventListener, onDirective } from '../../src/directives/on'
import { warningHandler } from '../../src/log/warnings'

const makeParseResult = (values: unknown[]) =>
  ({
    value: () => values,
    stop: () => {},
    refs: [],
    context: {},
  }) as any

let originalWarning: (...args: unknown[]) => void

beforeEach(() => {
  originalWarning = warningHandler.warning
  warningHandler.warning = vi.fn()
})

afterEach(() => {
  warningHandler.warning = originalWarning
})

test('attachEventListener warns when event type is missing', () => {
  const el = document.createElement('button')
  const method = vi.fn()
  const unbind = attachEventListener(el, '', method, '')
  el.dispatchEvent(new Event('click'))
  unbind()
  expect(method).not.toHaveBeenCalled()
  expect(warningHandler.warning).toHaveBeenCalled()
})

test('attachEventListener supports stop+prevent flags', () => {
  const parent = document.createElement('div')
  const child = document.createElement('button')
  parent.appendChild(child)

  const parentSpy = vi.fn()
  parent.addEventListener('click', parentSpy)
  const childSpy = vi.fn()
  attachEventListener(child, 'click', childSpy, 'stop,prevent')

  const e = new MouseEvent('click', { bubbles: true, cancelable: true })
  const result = child.dispatchEvent(e)

  expect(childSpy).toHaveBeenCalledTimes(1)
  expect(parentSpy).not.toHaveBeenCalled()
  expect(e.defaultPrevented).toBe(true)
  expect(result).toBe(false)
})

test('attachEventListener respects self flag', () => {
  const parent = document.createElement('div')
  const child = document.createElement('button')
  parent.appendChild(child)
  const spy = vi.fn()

  attachEventListener(parent, 'click', spy, 'self')

  child.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(spy).not.toHaveBeenCalled()

  parent.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(spy).toHaveBeenCalledTimes(1)
})

test('attachEventListener supports once flag', () => {
  const el = document.createElement('button')
  const spy = vi.fn()
  attachEventListener(el, 'click', spy, 'once')

  el.dispatchEvent(new MouseEvent('click'))
  el.dispatchEvent(new MouseEvent('click'))

  expect(spy).toHaveBeenCalledTimes(1)
})

test('attachEventListener handles left/middle/right mouse flags', () => {
  const el = document.createElement('button')
  const left = vi.fn()
  const middle = vi.fn()
  const right = vi.fn()

  attachEventListener(el, 'click', left, 'left')
  attachEventListener(el, 'click', middle, 'middle')
  attachEventListener(el, 'click', right, 'right')

  el.dispatchEvent(new MouseEvent('click', { button: 0 }))
  el.dispatchEvent(new MouseEvent('click', { button: 1 }))
  el.dispatchEvent(new MouseEvent('click', { button: 2 }))

  expect(left).toHaveBeenCalledTimes(1)
  expect(middle).toHaveBeenCalledTimes(1)
  expect(right).toHaveBeenCalledTimes(1)
})

test('attachEventListener handles keyboard event filters and modifiers', () => {
  const el = document.createElement('input')
  const spy = vi.fn()
  attachEventListener(el, 'keydown.enter', spy, 'ctrl,shift')

  const ok = new Event('keydown') as any
  ok.key = 'Enter'
  ok.ctrlKey = true
  ok.shiftKey = true
  el.dispatchEvent(ok)

  const fail = new Event('keydown') as any
  fail.key = 'Enter'
  fail.ctrlKey = true
  fail.shiftKey = false
  el.dispatchEvent(fail)

  expect(spy).toHaveBeenCalledTimes(1)
})

test('attachEventListener executes lazy function chains', () => {
  const el = document.createElement('button')
  const spy = vi.fn()
  attachEventListener(el, 'click', () => () => spy(), '')

  el.dispatchEvent(new MouseEvent('click'))

  expect(spy).toHaveBeenCalledTimes(1)
})

test('onDirective supports dynamic event option', () => {
  const el = document.createElement('button')
  const click = vi.fn()
  const parseResult = makeParseResult([click, 'prevent'])
  const dynamicOption = makeParseResult(['click'])

  const unbind = onDirective.onBind!(
    el,
    parseResult,
    'expr',
    undefined,
    dynamicOption,
  )
  const e = new MouseEvent('click', { cancelable: true })
  el.dispatchEvent(e)
  unbind()

  expect(click).toHaveBeenCalledTimes(1)
  expect(e.defaultPrevented).toBe(true)
})

test('onDirective warns when object syntax receives non-object value', () => {
  const el = document.createElement('button')
  const parseResult = makeParseResult([123])

  const unbind = onDirective.onBind!(el, parseResult, 'expr')
  unbind()

  expect(warningHandler.warning).toHaveBeenCalled()
})

test('onDirective object syntax binds handlers and per-event flags', () => {
  const el = document.createElement('button')
  const spy = vi.fn()
  const parseResult = makeParseResult([
    () => ({
      click: () => () => spy(),
      click_flags: 'once',
    }),
  ])

  const unbind = onDirective.onBind!(el, parseResult, 'expr')
  el.dispatchEvent(new MouseEvent('click'))
  el.dispatchEvent(new MouseEvent('click'))
  unbind()

  expect(spy).toHaveBeenCalledTimes(1)
})

test('attachEventListener handles key modifiers without key filter', () => {
  const el = document.createElement('input')
  const spy = vi.fn()
  attachEventListener(el, 'keydown.', spy, 'ctrl')

  const miss = new Event('keydown') as any
  miss.key = 'x'
  miss.ctrlKey = false
  el.dispatchEvent(miss)

  const hit = new Event('keydown') as any
  hit.key = 'x'
  hit.ctrlKey = true
  el.dispatchEvent(hit)

  expect(spy).toHaveBeenCalledTimes(1)
})

test('onDirective isLazyKey ignores _flags keys', () => {
  expect(onDirective.isLazyKey?.('click', 0)).toBe(true)
  expect(onDirective.isLazyKey?.('click_flags', 0)).toBe(false)
})

test('onDirective dynamic option ignores non-string event type', () => {
  const el = document.createElement('button')
  const click = vi.fn()
  const parseResult = makeParseResult([click, 'prevent'])
  const dynamicOption = makeParseResult([123])

  const unbind = onDirective.onBind!(
    el,
    parseResult,
    'expr',
    undefined,
    dynamicOption,
  )
  el.dispatchEvent(new MouseEvent('click', { cancelable: true }))
  unbind()

  expect(click).not.toHaveBeenCalled()
})

test('attachEventListener keyboard modifiers require alt and meta when requested', () => {
  const el = document.createElement('input')
  const spy = vi.fn()
  attachEventListener(el, 'keydown.enter', spy, 'alt,meta')

  const miss = new Event('keydown') as any
  miss.key = 'Enter'
  miss.altKey = false
  miss.metaKey = false
  el.dispatchEvent(miss)

  const hit = new Event('keydown') as any
  hit.key = 'Enter'
  hit.altKey = true
  hit.metaKey = true
  el.dispatchEvent(hit)

  expect(spy).toHaveBeenCalledTimes(1)
})

test('attachEventListener submit+prevent does not call missing handler', () => {
  const form = document.createElement('form')
  attachEventListener(form as any, 'submit', undefined as any, 'prevent')

  const ev = new Event('submit', { cancelable: true })
  form.dispatchEvent(ev)

  expect(ev.defaultPrevented).toBe(true)
})

test('onDirective static option reads flags from parse result when none provided', () => {
  const el = document.createElement('button')
  const click = vi.fn()
  const parseResult = makeParseResult([click, 'prevent'])
  const unbind = onDirective.onBind!(el, parseResult, 'expr', 'click')

  const ev = new MouseEvent('click', { cancelable: true })
  el.dispatchEvent(ev)
  unbind()

  expect(click).toHaveBeenCalledTimes(1)
  expect(ev.defaultPrevented).toBe(true)
})

test('onDirective object syntax supports direct object values', () => {
  const el = document.createElement('button')
  const click = vi.fn()
  const parseResult = makeParseResult([
    {
      click,
    },
  ])

  onDirective.onBind!(el, parseResult, 'expr')
  el.dispatchEvent(new MouseEvent('click'))

  expect(click).toHaveBeenCalledTimes(1)
})
