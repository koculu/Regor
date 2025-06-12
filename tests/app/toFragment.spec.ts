import { expect, test } from 'vitest'
import { toFragment, toJsonTemplate } from '../../src'

const json = { t: 'div', a: { id: 'foo' }, c: [{ t: 'span', c: [{ d: 'hi' }] }] }

test('json to fragment and back', () => {
  const fragment = toFragment(json)
  const div = fragment.firstElementChild as Element
  expect(div.tagName).toBe('DIV')
  expect(div.querySelector('span')?.textContent).toBe('hi')
  const back = toJsonTemplate(div)
  expect(back).toEqual({ t: 'DIV', a: { id: 'foo' }, c: [{ t: 'SPAN', c: [{ d: 'hi' }] }] })
})

test('svg conversion', () => {
  const svgJson = { t: 'svg', a: { width: '10' }, c: [{ t: 'circle', a: { r: '5' } }] }
  const frag = toFragment(svgJson, true)
  const svg = frag.firstElementChild as SVGElement
  expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')
  const json2 = toJsonTemplate(svg)
  expect(json2.t).toBe('svg')
})
