import { expect, test } from 'vitest'
import { createApp, ref, html } from '../../src'

test('r-model expression flag int converts input to integer', () => {
  const root = document.createElement('div')
  const count = ref(0)
  createApp(
    { count },
    { element: root, template: html`<input r-model="count, 'int'" />` },
  )
  const input = root.querySelector('input') as HTMLInputElement
  input.value = '7.8'
  input.dispatchEvent(new Event('input'))
  expect(count()).toBe(7)
})
