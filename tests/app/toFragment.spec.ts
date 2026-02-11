import { expect, test } from 'vitest'

import { toFragment, toJsonTemplate } from '../../src'

// Verify rendering from JSONTemplate

test('toFragment renders JSON template', () => {
  const json = {
    t: 'div',
    a: { id: 'foo' },
    c: [{ t: 'span', c: [{ d: 'bar' }] }],
  }
  const frag = toFragment(json)
  const div = frag.firstChild as HTMLElement
  expect(div?.tagName).toBe('DIV')
  expect(div.getAttribute('id')).toBe('foo')
  expect(div.querySelector('span')?.textContent).toBe('bar')
})

// Verify conversion from element to JSONTemplate

test('toJsonTemplate converts element to JSON template', () => {
  const div = document.createElement('div')
  div.setAttribute('id', 'x')
  const span = document.createElement('span')
  span.textContent = 'hi'
  div.appendChild(span)
  const json = toJsonTemplate(div) as any
  expect(json.t).toBe('DIV')
  expect(json.a.id).toBe('x')
  expect(json.c[0].t).toBe('SPAN')
  expect(json.c[0].c[0].d).toBe('hi')
})
