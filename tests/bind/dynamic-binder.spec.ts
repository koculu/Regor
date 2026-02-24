import { expect, test } from 'vitest'

import { createApp, createComponent, html, ref, RegorConfig } from '../../src'
import { Binder } from '../../src/bind/Binder'
import { Parser } from '../../src/parser/Parser'

test('dynamic binder transitions between components and unmounts invalid values', () => {
  const root = document.createElement('div')
  const current = ref<any>('alphaBox')

  const alphaBox = createComponent(html`<p>Alpha</p>`)
  const betaBox = createComponent(html`<p>Beta</p>`)

  createApp(
    {
      current,
      components: {
        alphaBox,
        betaBox,
      },
    },
    {
      element: root,
      template: html`<div :is="current"></div>`,
    },
  )

  const read = () => root.querySelector('p')?.textContent
  expect(read()).toBe('Alpha')

  // Same value should keep the mounted branch stable.
  current('alphaBox')
  expect(read()).toBe('Alpha')

  current('betaBox')
  expect(read()).toBe('Beta')

  current('')
  expect(read()).toBeUndefined()

  current({ name: 'alphaBox' })
  expect(read()).toBe('Alpha')

  current(betaBox)
  expect(read()).toBe('Beta')

  current({ name: 'betaBox' })
  expect(read()).toBe('Beta')
})

test('dynamic binder converts is="r-*" to native element and binds attributes', () => {
  const root = document.createElement('div')
  const label = ref('hello')

  createApp(
    { label },
    {
      element: root,
      template: html`<div is="r-section" class="wrap" :title="label"></div>`,
    },
  )

  const section = root.querySelector('section') as HTMLElement | null
  expect(section).toBeTruthy()
  expect(section?.className).toBe('wrap')
  expect(section?.getAttribute('title')).toBe('hello')

  label('world')
  expect(section?.getAttribute('title')).toBe('world')
})

test('dynamic binder leaves plain is attribute values untouched', () => {
  const root = document.createElement('div')

  createApp(
    {},
    {
      element: root,
      template: html`<div is="button" id="x">x</div>`,
    },
  )

  const div = root.querySelector('#x') as HTMLElement | null
  expect(div?.tagName).toBe('DIV')
  expect(div?.getAttribute('is')).toBe('button')
})

test('dynamic binder mounts child content into resolved component and supports unbind cleanup', () => {
  const root = document.createElement('div')
  const current = ref('boxComp')
  const boxComp = createComponent(html`<article><slot></slot></article>`)

  const app = createApp(
    {
      current,
      components: { boxComp },
    },
    {
      element: root,
      template: html`<div :is="current">
        <span class="inner">inside</span>
      </div>`,
    },
  )

  expect(root.querySelector('article .inner')?.textContent).toBe('inside')
  app.unbind()
  expect(() => current('boxComp')).not.toThrow()
})

test('dynamic binder returns early for empty and invalid r-* static names', () => {
  const parser = new Parser([{}], new RegorConfig())
  const binder = new Binder(parser)
  const parent = document.createElement('section')

  const empty = document.createElement('div')
  empty.setAttribute('is', '')
  parent.appendChild(empty)

  const invalid = document.createElement('div')
  invalid.setAttribute('is', 'r-')
  parent.appendChild(invalid)

  binder.__dynamicBinder.__bind(empty)
  binder.__dynamicBinder.__bind(invalid)

  expect(parent.childNodes.length).toBe(2)
  expect((parent.childNodes[0] as Element).getAttribute('is')).toBe('')
  expect((parent.childNodes[1] as Element).getAttribute('is')).toBe('r-')
})
