import { expect, test } from 'vitest'

import { createApp, html, ref } from '../../src'
import { classDirective } from '../../src/directives/class'
import { updateDirective } from '../directive-test-utils'

test('class directive toggles classes', () => {
  const root = document.createElement('div')
  const app = createApp(
    {
      activeTab: ref('app'),
    },
    {
      element: root,
      template: html`<div>
        <div id="app" :class="{ active: activeTab === 'app' }"></div>
        <div id="js" :class="{ active: activeTab === 'js' }"></div>
        <div id="ts" :class="{ active: activeTab === 'ts' }"></div>
      </div>`,
    },
  )
  expect(root.querySelector('#app')?.classList.contains('active')).toBe(true)
  expect(root.querySelector('#js')?.classList.contains('active')).toBe(false)
  expect(root.querySelector('#ts')?.classList.contains('active')).toBe(false)
  app.context.activeTab('js')
  expect(root.querySelector('#app')?.classList.contains('active')).toBe(false)
  expect(root.querySelector('#js')?.classList.contains('active')).toBe(true)
  expect(root.querySelector('#ts')?.classList.contains('active')).toBe(false)
})

test('class directive handles space-separated class lists', () => {
  const root = document.createElement('div')
  const cls = ref('a b')
  createApp(
    { cls },
    { element: root, template: html`<div :class="cls"></div>` },
  )
  const div = root.querySelector('div') as HTMLDivElement
  expect(div.classList.contains('a')).toBe(true)
  expect(div.classList.contains('b')).toBe(true)
  expect(div.classList.length).toBe(2)
  cls('b c')
  expect(div.classList.contains('a')).toBe(false)
  expect(div.classList.contains('b')).toBe(true)
  expect(div.classList.contains('c')).toBe(true)
  expect(div.classList.length).toBe(2)
})

test('class directive supports array entries and previous-array cleanup', () => {
  const el = document.createElement('div')
  el.className = 'old stale'

  updateDirective(
    classDirective,
    el,
    [['new', { keep: true, stale: false }]],
    [['old', { stale: true }]],
  )

  expect(el.classList.contains('old')).toBe(false)
  expect(el.classList.contains('new')).toBe(true)
  expect(el.classList.contains('keep')).toBe(true)
  expect(el.classList.contains('stale')).toBe(false)
})

test('class directive removes previous string classes when next is null', () => {
  const el = document.createElement('div')
  el.className = 'a b'

  updateDirective(classDirective, el, [null], ['a b'])

  expect(el.classList.contains('a')).toBe(false)
  expect(el.classList.contains('b')).toBe(false)
})

test('class directive keeps class list stable when next string equals previous', () => {
  const el = document.createElement('div')
  el.className = 'x y'

  updateDirective(classDirective, el, ['x y'], ['x y'])

  expect(el.className).toBe('x y')
})
