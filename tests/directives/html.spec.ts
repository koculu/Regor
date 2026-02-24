import { expect, test, vi } from 'vitest'

import { htmlDirective } from '../../src/directives/html'

test('html directive uses custom replacer when provided', () => {
  const el = document.createElement('div')
  el.innerHTML = '<span>old</span>'
  const replacer = vi.fn()

  htmlDirective.onChange!(el, ['<b>new</b>', replacer])

  expect(replacer).toHaveBeenCalledWith(el, '<b>new</b>')
  expect(el.innerHTML).toBe('<span>old</span>')
})

test('html directive sets innerHTML from value.toString()', () => {
  const el = document.createElement('div')
  const value = {
    toString: () => '<strong>x</strong>',
  }

  htmlDirective.onChange!(el, [value])

  expect(el.querySelector('strong')?.textContent).toBe('x')
})

test('html directive supports primitive values', () => {
  const el = document.createElement('div')

  htmlDirective.onChange!(el, [1234])

  expect(el.textContent).toBe('1234')
})
