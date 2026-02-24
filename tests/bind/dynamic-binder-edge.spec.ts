import { expect, test } from 'vitest'

import { RegorConfig } from '../../src/app/RegorConfig'
import { Binder } from '../../src/bind/Binder'
import { Parser } from '../../src/parser/Parser'
import { ref } from '../../src/reactivity/ref'

const createBinder = (context: Record<string, unknown> = {}) => {
  const parser = new Parser([context], new RegorConfig())
  return new Binder(parser)
}

test('dynamic binder ignores non-regor and empty is values', () => {
  const binder = createBinder()
  const db = (binder as any).__dynamicBinder
  const a = document.createElement('div')
  a.setAttribute('is', 'x-native')
  expect(() => db.__bind(a)).not.toThrow()
  expect(a.getAttribute('is')).toBe('x-native')

  const b = document.createElement('div')
  b.setAttribute('is', 'r-   ')
  expect(() => db.__bind(b)).not.toThrow()
  expect(b.getAttribute('is')).toBe('r-   ')
})

test('dynamic binder resolves object component values by instance lookup', () => {
  const target = {}
  const nameRef = ref(target as any)
  const binder = createBinder({
    selected: nameRef,
    components: { div: target },
  })
  const db = (binder as any).__dynamicBinder
  const root = document.createElement('div')
  const el = document.createElement('template')
  el.setAttribute((db.__is as string) ?? 'r-is', 'selected')
  el.innerHTML = '<span>slot</span>'
  root.appendChild(el)

  db.__bind(el as any)
  expect(root.querySelector('div')).toBeTruthy()

  nameRef({ name: 'div' } as any)
  expect(root.querySelector('div')).toBeTruthy()
})
