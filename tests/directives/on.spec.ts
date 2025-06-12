import { expect, test, vi } from 'vitest'
import { createApp, html } from '../../src'

test('click.left fires only on left button', () => {
  const root = document.createElement('div')
  const handler = vi.fn()
  createApp({ handler }, { element: root, template: html`<button @click.left="handler"></button>` })

  const btn = root.querySelector('button') as HTMLButtonElement

  btn.dispatchEvent(new MouseEvent('click', { button: 0 }))
  expect(handler).toHaveBeenCalledTimes(1)

  btn.dispatchEvent(new MouseEvent('click', { button: 1 }))
  btn.dispatchEvent(new MouseEvent('click', { button: 2 }))
  expect(handler).toHaveBeenCalledTimes(1)
})

test('click.middle fires only on middle button', () => {
  const root = document.createElement('div')
  const handler = vi.fn()
  createApp({ handler }, { element: root, template: html`<button @click.middle="handler"></button>` })

  const btn = root.querySelector('button') as HTMLButtonElement

  btn.dispatchEvent(new MouseEvent('click', { button: 1 }))
  expect(handler).toHaveBeenCalledTimes(1)

  btn.dispatchEvent(new MouseEvent('click', { button: 0 }))
  btn.dispatchEvent(new MouseEvent('click', { button: 2 }))
  expect(handler).toHaveBeenCalledTimes(1)
})

test('click.right fires only on right button', () => {
  const root = document.createElement('div')
  const handler = vi.fn()
  createApp({ handler }, { element: root, template: html`<button @click.right="handler"></button>` })

  const btn = root.querySelector('button') as HTMLButtonElement

  btn.dispatchEvent(new MouseEvent('click', { button: 2 }))
  expect(handler).toHaveBeenCalledTimes(1)

  btn.dispatchEvent(new MouseEvent('click', { button: 0 }))
  btn.dispatchEvent(new MouseEvent('click', { button: 1 }))
  expect(handler).toHaveBeenCalledTimes(1)
})
