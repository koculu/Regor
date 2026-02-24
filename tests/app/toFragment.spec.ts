import { expect, test } from 'vitest'

import { toFragment, toJsonTemplate } from '../../src'

// Verify rendering from JSONTemplate

test('toFragment renders JSON template', () => {
  const json = {
    t: 'div',
    a: { id: 'foo', '#slotName': '' },
    c: [{ t: 'span', c: [{ d: 'bar' }] }],
  }
  const frag = toFragment(json)
  const div = frag.firstChild as HTMLElement
  expect(div?.tagName).toBe('DIV')
  expect(div.getAttribute('id')).toBe('foo')
  expect(div.getAttribute('name')).toBe('slotName')
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

test('toFragment supports array input and comment/text nodes', () => {
  const frag = toFragment([{ d: 'txt' }, { n: Node.COMMENT_NODE, d: 'c' }])
  expect(frag.childNodes.length).toBe(2)
  expect(frag.firstChild?.nodeType).toBe(Node.TEXT_NODE)
  expect(frag.lastChild?.nodeType).toBe(Node.COMMENT_NODE)
})

test('toFragment appends into template.content and ignores empty text payloads', () => {
  const frag = toFragment({
    t: 'template',
    c: [{ t: 'span', c: [{ d: 'in-template' }] }, { d: '' }],
  } as any)
  const tpl = frag.firstChild as HTMLTemplateElement
  expect(tpl.tagName).toBe('TEMPLATE')
  expect(tpl.content.querySelector('span')?.textContent).toBe('in-template')
  expect(tpl.content.childNodes.length).toBe(1)
})

test('toFragment throws on unsupported node type', () => {
  expect(() => toFragment({ n: 99 as any, d: 'x' } as any)).toThrow(
    'unsupported node type.',
  )
})

test('toJsonTemplate supports element arrays', () => {
  const a = document.createElement('div')
  a.setAttribute('id', 'a')
  const b = document.createElement('span')
  b.setAttribute('id', 'b')

  const json = toJsonTemplate([a, b] as any[]) as any[]
  expect(json.length).toBe(2)
  expect(json[0].a.id).toBe('a')
  expect(json[1].a.id).toBe('b')
})

test('toJsonTemplate handles comment nodes and nullable attrs via stubs', () => {
  const c = document.createComment('note')
  const jc = toJsonTemplate(c as any) as any
  expect(jc.n).toBe(Node.COMMENT_NODE)
  expect(jc.d).toBe('note')

  const emptyTextComment = document.createComment('')
  const je = toJsonTemplate(emptyTextComment as any) as any
  expect(je.n).toBe(Node.COMMENT_NODE)
  expect('d' in je).toBe(false)

  const fake = {
    tagName: 'DIV',
    getAttributeNames: () => ['x'],
    getAttribute: () => null,
    childNodes: [],
  } as any
  const jf = toJsonTemplate(fake) as any
  expect(jf.a.x).toBe('')
})
