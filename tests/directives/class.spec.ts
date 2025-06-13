import { expect, test } from 'vitest'
import { createApp, html, ref } from '../../src'

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
