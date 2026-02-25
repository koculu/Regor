import { expect, test } from 'vitest'

import { createApp, html, ref } from '../../src'

test('r-bind mapping: ":" shorthand binds as attribute', () => {
  const root = document.createElement('div')
  createApp(
    { idValue: ref('alpha') },
    {
      element: root,
      template: html`<div id="x" :data-id="idValue"></div>`,
    },
  )

  const el = root.querySelector('#x') as HTMLElement | null
  if (!el) throw new Error('missing #x')
  expect(el.getAttribute('data-id')).toBe('alpha')
})

test('r-bind mapping: "." shorthand binds as property', () => {
  const root = document.createElement('div')
  createApp(
    { titleValue: ref('hello-prop') },
    {
      element: root,
      template: html`<div id="x" .title="titleValue"></div>`,
    },
  )

  const el = root.querySelector('#x') as HTMLElement | null
  if (!el) throw new Error('missing #x')
  expect(el.title).toBe('hello-prop')
})

test('r-bind mapping: ".prop" flag switches ":" binding to property binding', () => {
  const root = document.createElement('div')
  createApp(
    { valueRef: ref('prop-value') },
    {
      element: root,
      template: html`<input id="i" :value.prop="valueRef" />`,
    },
  )

  const input = root.querySelector('#i') as HTMLInputElement | null
  if (!input) throw new Error('missing #i')
  expect(input.value).toBe('prop-value')
  // property path does not set value attribute for non-null values
  expect(input.getAttribute('value')).toBeNull()
})

test('r-bind mapping: ".camel" camelizes option key before binding', () => {
  const root = document.createElement('div')
  createApp(
    { v: ref('x') },
    {
      element: root,
      template: html`<div id="x" :data-id.camel="v"></div>`,
    },
  )

  const el = root.querySelector('#x') as HTMLElement | null
  if (!el) throw new Error('missing #x')
  expect(el.getAttribute('data-id')).toBeNull()
  // setAttribute('dataId', ...) is normalized to lowercase in HTML
  expect(el.getAttribute('dataid')).toBe('x')
})

test('style mapping: r-style is an alias of :style', () => {
  const root = document.createElement('div')
  const app = createApp(
    {
      colorRef: ref('red'),
      padRef: ref('2px'),
    },
    {
      element: root,
      template: html`<div id="x" r-style="{ color: colorRef, padding: padRef }"></div>`,
    },
  )

  const el = root.querySelector('#x') as HTMLElement | null
  if (!el) throw new Error('missing #x')
  expect(el.style.color).toBe('red')
  expect(el.style.padding).toBe('2px')

  app.context.colorRef('blue')
  app.context.padRef('4px')
  expect(el.style.color).toBe('blue')
  expect(el.style.padding).toBe('4px')
})
