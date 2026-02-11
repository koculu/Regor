import { expect, test } from 'vitest'

import { createApp, html, ref } from '../../src'

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

test('r-model trim flag removes whitespace', () => {
  const root = document.createElement('div')
  const msg = ref('')
  createApp(
    { msg },
    { element: root, template: html`<input r-model="msg, 'trim'" />` },
  )
  const input = root.querySelector('input') as HTMLInputElement
  input.value = '  hello  '
  input.dispatchEvent(new Event('input'))
  expect(msg()).toBe('hello')
})

test('r-model.lazy updates only on change', () => {
  const root = document.createElement('div')
  const val = ref('')
  createApp(
    { val },
    { element: root, template: html`<input r-model.lazy="val" />` },
  )
  const input = root.querySelector('input') as HTMLInputElement
  input.value = 'a'
  input.dispatchEvent(new Event('input'))
  expect(val()).toBe('')
  input.dispatchEvent(new Event('change'))
  expect(val()).toBe('a')
})

test('r-model number flag converts to number', () => {
  const root = document.createElement('div')
  const num = ref(0)
  createApp(
    { num },
    { element: root, template: html`<input r-model="num, 'number'" />` },
  )
  const input = root.querySelector('input') as HTMLInputElement
  input.value = '5.5'
  input.dispatchEvent(new Event('input'))
  expect(num()).toBe(5.5)
  input.value = 'foo'
  input.dispatchEvent(new Event('input'))
  expect(num()).toBe('')
})

test('r-model with checkboxes populates array', () => {
  const root = document.createElement('div')
  const selected = ref<string[]>([])
  createApp(
    { selected },
    {
      element: root,
      template: html`<input type="checkbox" value="a" r-model="selected" />
        <input type="checkbox" value="b" r-model="selected" />`,
    },
  )
  const [c1, c2] = root.querySelectorAll(
    'input',
  ) as NodeListOf<HTMLInputElement>
  c1.checked = true
  c1.dispatchEvent(new Event('change'))
  expect(JSON.stringify(selected())).toBe('["a"]')
  c2.checked = true
  c2.dispatchEvent(new Event('change'))
  expect(JSON.stringify(selected())).toBe('["a","b"]')
  c1.checked = false
  c1.dispatchEvent(new Event('change'))
  expect(JSON.stringify(selected())).toBe('["b"]')
})

test('r-model with select multiple populates set', () => {
  const root = document.createElement('div')
  const opts = ref(new Set<string>())
  createApp(
    { opts },
    {
      element: root,
      template: html`<select r-model="opts" multiple>
        <option value="x">x</option>
        <option value="y">y</option>
      </select>`,
    },
  )
  const select = root.querySelector('select') as HTMLSelectElement
  const optionX = select.options[0]
  const optionY = select.options[1]
  optionX.selected = true
  select.dispatchEvent(new Event('change'))
  expect(opts().has('x')).toBe(true)
  optionY.selected = true
  select.dispatchEvent(new Event('change'))
  expect(Array.from(opts())).toStrictEqual(['x', 'y'])
  optionX.selected = false
  select.dispatchEvent(new Event('change'))
  expect(Array.from(opts())).toStrictEqual(['y'])
})
