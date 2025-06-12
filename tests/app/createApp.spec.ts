import { expect, test } from 'vitest'
import { createApp, ref, html, raw } from '../../src'

test('hello world', () => {
  const root = document.createElement('div')
  createApp(
    {
      message: ref('hello world'),
    },
    {
      element: root,
      template: html`<div>{{ message }}</div>`,
    },
  )

  expect(root.textContent).toBe('hello world')
})

test('click counter', () => {
  const root = document.createElement('div')
  const count = ref(0)
  createApp(
    {
      count,
    },
    {
      element: root,
      template: html`<div>count: {{ count }}</div>
        <button @click="count++">click me: {{ count }}</button>`,
    },
  )
  expect(root.querySelector('div > span')?.textContent).toBe('0')
  for (let i = 0; i < 10; ++i) {
    root.querySelector('button')?.click()
    expect(root.querySelector('div > span')?.textContent).toBe(`${i + 1}`)
  }
  expect(root.innerHTML).toBe(
    raw`<div>count: <span>10</span></div><button>click me: <span>10</span></button>`,
  )
})
