import { expect, test } from 'vitest'

import { textDirective } from '../../src/directives/text'
import { updateDirective } from '../directive-test-utils'

test('text directive stringifies Set values', () => {
  const el = document.createElement('div')

  updateDirective(textDirective, el, [new Set(['a', 'b'])])

  expect(el.textContent).toBe('["a","b"]')
})

test('text directive stringifies Map values', () => {
  const el = document.createElement('div')

  updateDirective(textDirective, el, [new Map([['k', 'v']])])

  expect(el.textContent).toBe('[["k","v"]]')
})

test('text directive stringifies object values', () => {
  const el = document.createElement('div')

  updateDirective(textDirective, el, [{ a: 1, b: 2 }])

  expect(el.textContent).toBe('{"a":1,"b":2}')
})

test('text directive falls back to toString and nullish empty string', () => {
  const el = document.createElement('div')

  updateDirective(textDirective, el, [123])
  expect(el.textContent).toBe('123')

  updateDirective(textDirective, el, [null])
  expect(el.textContent).toBe('')
})
