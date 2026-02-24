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
