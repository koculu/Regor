import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { createApp, html, ref, RegorConfig } from '../../src'
import { warningHandler } from '../../src/log/warnings'

const texts = (root: HTMLElement) =>
  [...root.querySelectorAll('li')].map((x) => x.textContent)

const row = (id: string) => ref({ id, name: id })

let originalWarning: (...args: unknown[]) => void

beforeEach(() => {
  originalWarning = warningHandler.warning
  warningHandler.warning = vi.fn()
})

afterEach(() => {
  warningHandler.warning = originalWarning
})

test('r-for reorders mounted-ahead items and shrinks tail correctly', () => {
  const root = document.createElement('div')
  const items = ref([row('a'), row('b'), row('c'), row('d')])

  createApp(
    { items },
    {
      element: root,
      template: html`<ul>
        <li r-for="{ id, name } in items" :key="id">{{ name }}</li>
      </ul>`,
    },
  )

  items().splice(0, 2)
  expect(texts(root)).toStrictEqual(['c', 'd'])
})

test('r-for uses replace path when growth threshold is zero', () => {
  const root = document.createElement('div')
  const items = ref([row('a'), row('b')])
  const config = new RegorConfig()
  config.forGrowThreshold = 0

  createApp(
    { items },
    {
      element: root,
      template: html`<ul>
        <li r-for="{ id, name } in items" :key="id">{{ name }}</li>
      </ul>`,
    },
    config,
  )

  items().splice(0, 2, row('x'), row('a'))
  expect(texts(root)).toStrictEqual(['x', 'a'])
})

test('r-for grows and then shrinks around forGrowThreshold', () => {
  const root = document.createElement('div')
  const items = ref([row('a'), row('b')])
  const config = new RegorConfig()
  config.forGrowThreshold = 2

  createApp(
    { items },
    {
      element: root,
      template: html`<ul>
        <li r-for="{ id, name } in items" :key="id">{{ name }}</li>
      </ul>`,
    },
    config,
  )

  items().splice(0, 0, row('x'))
  items().push(row('y'))
  expect(texts(root)).toStrictEqual(['x', 'a', 'b', 'y'])

  items().splice(0, items().length, row('a'))
  expect(texts(root)).toStrictEqual(['a'])
})

test('r-for supports nullable iterable list', () => {
  const root = document.createElement('div')
  const list = ref<any>(null)

  createApp(
    { list },
    {
      element: root,
      template: html`<ul>
        <li r-for="x in list">{{ x }}</li>
      </ul>`,
    },
  )

  expect(texts(root)).toStrictEqual([])
  list([ref('k')])
  expect(texts(root)).toStrictEqual(['k'])
})

test('r-for supports function-backed iterable list', () => {
  const root = document.createElement('div')
  const list = ref<any[]>([ref('a')])
  const asFn = () => list()

  createApp(
    { asFn, list },
    {
      element: root,
      template: html`<ul>
        <li r-for="x in asFn">{{ x }}</li>
      </ul>`,
    },
  )

  expect(texts(root)).toStrictEqual(['a'])
})

test('r-for supports non-hash index variable name', () => {
  const root = document.createElement('div')
  const list = ref([ref('a'), ref('b')])

  createApp(
    { list },
    {
      element: root,
      template: html`<ul>
        <li r-for="item, index in list">{{ index }}:{{ item }}</li>
      </ul>`,
    },
  )

  expect(texts(root)).toStrictEqual(['0:a', '1:b'])
})

test('r-for warns for missing and invalid expressions', () => {
  const root = document.createElement('div')

  createApp(
    { items: ref([ref('a')]) },
    {
      element: root,
      template: html`<div r-for></div>
        <div r-for="broken"></div>`,
    },
  )

  expect(warningHandler.warning).toHaveBeenCalled()
})

test('r-for renders simple r-text list', () => {
  const root = document.createElement('div')
  const rows = ref([ref({ label: 'A' }), ref({ label: 'B' })])

  createApp(
    { rows },
    {
      element: root,
      template: html`<ul>
        <li r-for="row in rows" r-text="row.label"></li>
      </ul>`,
    },
  )

  expect(texts(root)).toStrictEqual(['A', 'B'])
  rows()[1](ref({ label: 'B2' }))
  expect(texts(root)).toStrictEqual(['A', 'B2'])
})

test('r-for remounts same-key rows when item identity changes', () => {
  const root = document.createElement('div')
  const rows = ref([ref({ id: 1, label: 'A' }), ref({ id: 2, label: 'B' })])

  createApp(
    { rows },
    {
      element: root,
      template: html`<ul>
        <li r-for="row in rows" :key="row.id" r-text="row.label"></li>
      </ul>`,
    },
  )

  expect(texts(root)).toStrictEqual(['A', 'B'])
  const nextRows = [ref({ id: 1, label: 'A1' }), ref({ id: 2, label: 'B1' })]
  rows(nextRows)
  expect(texts(root)).toStrictEqual(['A1', 'B1'])

  nextRows[0]().label.value = 'A2'
  expect(texts(root)).toStrictEqual(['A2', 'B1'])
})

test('r-for keeps reactivity for simple r-text and :class template', () => {
  const root = document.createElement('div')
  const rows = ref([
    ref({ id: 1, label: 'A', kind: 'k-a' }),
    ref({ id: 2, label: 'B', kind: 'k-b' }),
  ])

  createApp(
    { rows },
    {
      element: root,
      template: html`<ul>
        <li r-for="row in rows" :key="row.id">
          <span r-text="row.label"></span>
          <span :class="row.kind">x</span>
        </li>
      </ul>`,
    },
  )

  const spans = [...root.querySelectorAll('li > span')]
  const text = spans.filter((_, i) => i % 2 === 0).map((x) => x.textContent)
  const classes = spans.filter((_, i) => i % 2 === 1).map((x) => x.className)
  expect(text).toStrictEqual(['A', 'B'])
  expect(classes).toStrictEqual(['k-a', 'k-b'])

  rows()[0](ref({ ...rows()[0](), label: 'A2' }))
  rows()[1](ref({ ...rows()[1](), kind: 'k-b2' }))

  const nextSpans = [...root.querySelectorAll('li > span')]
  const nextText = nextSpans
    .filter((_, i) => i % 2 === 0)
    .map((x) => x.textContent)
  const nextClasses = nextSpans
    .filter((_, i) => i % 2 === 1)
    .map((x) => x.className)
  expect(nextText).toStrictEqual(['A2', 'B'])
  expect(nextClasses).toStrictEqual(['k-a', 'k-b2'])
})

test('r-for fallback diff handles duplicate keys and mixed insert/remove updates', () => {
  const root = document.createElement('div')
  const rows = ref([
    ref({ id: 1, name: 'a' }),
    ref({ id: 2, name: 'b' }),
    ref({ id: 3, name: 'c' }),
    ref({ id: 4, name: 'd' }),
    ref({ id: 5, name: 'e' }),
  ])
  const config = new RegorConfig()
  config.forGrowThreshold = 3

  const app = createApp(
    { rows },
    {
      element: root,
      template: html`<ul>
        <li r-for="row in rows" :key="row.id">{{ row.name }}</li>
      </ul>`,
    },
    config,
  )

  // Duplicate keys force keyed patcher fallback.
  rows([
    ref({ id: 3, name: 'c1' }),
    ref({ id: 3, name: 'c2' }),
    ref({ id: 5, name: 'e1' }),
  ])
  expect(texts(root)).toStrictEqual(['c1', 'c2', 'e1'])

  // Exercise fallback grow/insert paths.
  rows([
    ref({ id: 3, name: 'c1' }),
    ref({ id: 9, name: 'x1' }),
    ref({ id: 9, name: 'x2' }),
    ref({ id: 5, name: 'e1' }),
    ref({ id: 10, name: 'z' }),
  ])
  expect(texts(root)).toStrictEqual(['c1', 'x1', 'x2', 'e1', 'z'])

  // Exercise fallback removals/tail shrink.
  rows([ref({ id: 3, name: 'c1' }), ref({ id: 9, name: 'x1' })])
  expect(texts(root)).toStrictEqual(['c1', 'x1'])
  app.unbind()
})

test('r-for supports array destructuring list aliases', () => {
  const root = document.createElement('div')
  const rows = ref([ref(['Alice', 30]), ref(['Bob', 25])])
  const app = createApp(
    { rows },
    {
      element: root,
      template: html`<ul>
        <li r-for="[name, age] in rows">{{ name }}-{{ age }}</li>
      </ul>`,
    },
  )

  expect(texts(root)).toStrictEqual(['Alice-30', 'Bob-25'])
  app.unbind()
})

test('r-for fallback replace path is used when growth threshold is zero', () => {
  const root = document.createElement('div')
  const rows = ref([ref({ id: 1, name: 'a' }), ref({ id: 2, name: 'b' })])
  const config = new RegorConfig()
  config.forGrowThreshold = 0

  createApp(
    { rows },
    {
      element: root,
      template: html`<ul>
        <li r-for="row in rows" :key="row.id">{{ row.name }}</li>
      </ul>`,
    },
    config,
  )

  // Duplicate key forces keyed diff fallback; zero threshold forces replace path.
  rows([
    ref({ id: 1, name: 'a1' }),
    ref({ id: 9, name: 'x1' }),
    ref({ id: 9, name: 'x2' }),
  ])

  expect(texts(root)).toStrictEqual(['a1', 'x1', 'x2'])
})
