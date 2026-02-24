import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { attrDirective } from '../../src/directives/attr'
import { warningHandler } from '../../src/log/warnings'

let originalWarning: (...args: unknown[]) => void

beforeEach(() => {
  originalWarning = warningHandler.warning
  warningHandler.warning = vi.fn()
})

afterEach(() => {
  warningHandler.warning = originalWarning
})

test('attr directive supports option + camel flag', () => {
  const el = document.createElement('div')

  attrDirective.onChange!(el, ['x'], undefined, 'data-name', undefined, [
    'camel',
  ])

  expect(el.getAttribute('dataName')).toBe('x')
})

test('attr directive supports kv tuple and object syntaxes', () => {
  const el = document.createElement('div')

  attrDirective.onChange!(el, ['k1', 'v1', ['k2', 'v2'], { k3: 'v3' }])

  expect(el.getAttribute('k1')).toBe('v1')
  expect(el.getAttribute('k2')).toBe('v2')
  expect(el.getAttribute('k3')).toBe('v3')
})

test('attr directive removes previous key when key changes', () => {
  const el = document.createElement('div')

  attrDirective.onChange!(el, [['k2', 'v2']], [['k1', 'old']])

  expect(el.getAttribute('k1')).toBe(null)
  expect(el.getAttribute('k2')).toBe('v2')
})

test('attr directive handles boolean attributes', () => {
  const el = document.createElement('input')

  attrDirective.onChange!(el, [['disabled', true]])
  expect(el.getAttribute('disabled')).toBe('')

  attrDirective.onChange!(el, [['disabled', false]])
  expect(el.getAttribute('disabled')).toBe(null)

  attrDirective.onChange!(el, [['disabled', '']])
  expect(el.getAttribute('disabled')).toBe('')
})

test('attr directive handles xlink attributes', () => {
  const el = document.createElement('svg') as any

  attrDirective.onChange!(el, [['xlink:href', '#a']])
  expect(el.getAttribute('xlink:href')).toBe('#a')

  attrDirective.onChange!(el, [['xlink:href', null]])
  expect(el.getAttribute('xlink:href')).toBe(null)
})

test('attr directive warns for invalid key types', () => {
  const el = document.createElement('div')

  attrDirective.onChange!(
    el,
    [[{ bad: true }, 'x'] as any],
    undefined,
    undefined,
    undefined,
    undefined,
    '@bad',
  )
  attrDirective.onChange!(
    el,
    [[null, 'x'] as any],
    undefined,
    undefined,
    undefined,
    undefined,
    '@bad',
  )

  expect(warningHandler.warning).toHaveBeenCalled()
})
