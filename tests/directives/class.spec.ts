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
