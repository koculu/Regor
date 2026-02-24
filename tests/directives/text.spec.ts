import { expect, test } from 'vitest'

import { textDirective } from '../../src/directives/text'

test('text directive stringifies Set values', () => {
  const el = document.createElement('div')

  textDirective.onChange!(el, [new Set(['a', 'b'])])

  expect(el.textContent).toBe('["a","b"]')
})

test('text directive stringifies Map values', () => {
  const el = document.createElement('div')

  textDirective.onChange!(el, [new Map([['k', 'v']])])

  expect(el.textContent).toBe('[["k","v"]]')
})

test('text directive stringifies object values', () => {
  const el = document.createElement('div')

  textDirective.onChange!(el, [{ a: 1, b: 2 }])

  expect(el.textContent).toBe('{"a":1,"b":2}')
})

test('text directive falls back to toString and nullish empty string', () => {
  const el = document.createElement('div')

  textDirective.onChange!(el, [123])
  expect(el.textContent).toBe('123')

  textDirective.onChange!(el, [null])
  expect(el.textContent).toBe('')
})
