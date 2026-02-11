import { expect, test } from 'vitest'

import { RegorConfig } from '../../src'
import { ComponentHead } from '../../src/app/ComponentHead'

// Ensure getDefault returns a singleton

test('RegorConfig.getDefault returns singleton', () => {
  const c1 = RegorConfig.getDefault()
  const c2 = RegorConfig.getDefault()
  expect(c1).toBe(c2)
})

// Verify that addComponent registers components

test('addComponent registers component', () => {
  const config = new RegorConfig()
  const component = {
    defaultName: 'foo',
    template: document.createElement('div'),
    context: () => ({}),
  }
  config.addComponent(component)
  // internal maps store capitalized names
  expect((config as any).__components.get('Foo')).toBe(component)
  expect((config as any).__componentsUpperCase.get('FOO')).toBe(component)
})

// ComponentHead.unmount removes nodes between markers

test('ComponentHead.unmount removes child nodes', () => {
  const container = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  container.appendChild(start)
  const span = document.createElement('span')
  span.textContent = 'hi'
  container.appendChild(span)
  container.appendChild(end)
  const head = new ComponentHead({}, container, [], start, end)
  head.unmount()
  expect(container.contains(span)).toBe(false)
})
