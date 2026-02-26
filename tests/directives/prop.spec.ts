import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import * as unbindModule from '../../src/cleanup/unbind'
import { patchProp, propDirective } from '../../src/directives/prop'
import { warningHandler } from '../../src/log/warnings'
import { updateDirective } from '../directive-test-utils'

let originalWarning: (...args: unknown[]) => void

beforeEach(() => {
  originalWarning = warningHandler.warning
  warningHandler.warning = vi.fn()
})

afterEach(() => {
  warningHandler.warning = originalWarning
  vi.useRealTimers()
})

test('prop directive option path supports camel flag', () => {
  const el = document.createElement('div') as any

  updateDirective(propDirective, el, [1], undefined, 'foo-bar', undefined, [
    'camel',
  ])

  expect(el.fooBar).toBe(1)
})

test('prop directive supports kv, tuple and object syntaxes', () => {
  const el = document.createElement('div') as any

  updateDirective(propDirective, el, ['a', 1, ['b', 2], { c: 3 }])

  expect(el.a).toBe(1)
  expect(el.b).toBe(2)
  expect(el.c).toBe(3)
})

test('patchProp warns when key is empty', () => {
  patchProp(document.createElement('div'), undefined as any, 1)
  expect(warningHandler.warning).toHaveBeenCalled()
})

test('patchProp updates innerHTML and unbinds previous children', () => {
  vi.useFakeTimers()
  const spy = vi.spyOn(unbindModule, 'unbind')
  const el = document.createElement('div')
  const oldChild = document.createElement('span')
  el.appendChild(oldChild)

  patchProp(el, 'innerHTML', '<b>new</b>')
  vi.runAllTimers()

  expect(el.querySelector('b')?.textContent).toBe('new')
  expect(spy).toHaveBeenCalledWith(
    oldChild,
    expect.any(Number),
    expect.any(Array),
  )
})

test('patchProp handles value for standard elements', () => {
  const input = document.createElement('input') as any

  patchProp(input, 'value', 42)
  expect(input._value).toBe(42)
  expect(String(input.value)).toBe('42')

  patchProp(input, 'value', null)
  expect(input.getAttribute('value')).toBe(null)
})

test('patchProp keeps value path for option elements', () => {
  const option = document.createElement('option') as any
  option.setAttribute('value', 'a')

  patchProp(option, 'value', 'b')

  expect(String(option.value)).toBe('b')
})

test('patchProp coerces nullish booleans and removes nullable string attrs', () => {
  const select = document.createElement('select') as any
  patchProp(select, 'multiple', '')
  expect(select.multiple).toBe(true)

  const div = document.createElement('div') as any
  div.setAttribute('id', 'x')
  patchProp(div, 'id', null)
  expect(div.id).toBe('')
  expect(div.getAttribute('id')).toBe(null)
})

test('patchProp coerces nullable number props and removes attribute', () => {
  const img = document.createElement('img') as any
  img.setAttribute('width', '10')

  patchProp(img, 'width', null)

  expect(img.width).toBe(0)
  expect(img.getAttribute('width')).toBe(null)
})

test('patchProp warns when property assignment fails without auto-coercion', () => {
  const el: any = { tagName: 'DIV', removeAttribute: vi.fn() }
  Object.defineProperty(el, 'bad', {
    configurable: true,
    get: () => 1,
    set: () => {
      throw new Error('setter failed')
    },
  })

  patchProp(el, 'bad', 1)

  expect(warningHandler.warning).toHaveBeenCalled()
})

test('patchProp suppresses assignment warning when auto-removal branch is used', () => {
  const el: any = { tagName: 'DIV', removeAttribute: vi.fn() }
  Object.defineProperty(el, 'id', {
    configurable: true,
    get: () => '',
    set: () => {
      throw new Error('setter failed')
    },
  })

  patchProp(el, 'id', null)

  expect(el.removeAttribute).toHaveBeenCalledWith('id')
  expect(warningHandler.warning).not.toHaveBeenCalled()
})
