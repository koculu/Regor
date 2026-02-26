import { expect, test, vi } from 'vitest'

import { RegorConfig } from '../../src/app/RegorConfig'
import { Binder } from '../../src/bind/Binder'
import {
  addSwitch,
  hasSwitch,
  removeSwitch,
  rswitch,
} from '../../src/bind/switch'
import { teleportDirective } from '../../src/directives/teleport'
import { Parser } from '../../src/parser/Parser'
import { sref } from '../../src/reactivity/sref'

const createBinder = (context: Record<string, unknown> = {}) => {
  const parser = new Parser([context], new RegorConfig())
  return new Binder(parser)
}

test('binder bind skips pre nodes and non-elements', () => {
  const binder = createBinder()
  expect(() =>
    binder.__bindDefault(document.createTextNode('x') as any),
  ).not.toThrow()

  const el = document.createElement('div')
  el.setAttribute((binder as any).__pre, '')
  const spy = vi.spyOn(binder as any, '__bindAttributes')
  binder.__bindDefault(el)
  expect(spy).not.toHaveBeenCalled()
  spy.mockRestore()
})

test('binder unwrapTemplates covers template branches', () => {
  const binder = createBinder()

  // isTemplate(element) path with no parent
  const detachedTemplate = document.createElement('template')
  detachedTemplate.innerHTML = '<span>detached</span>'
  binder.__unwrapTemplates(detachedTemplate)

  // template with r-pre is skipped
  const root = document.createElement('div')
  const preTemplate = document.createElement('template')
  preTemplate.setAttribute((binder as any).__pre, '')
  preTemplate.innerHTML = '<span>pre</span>'
  root.appendChild(preTemplate)
  binder.__unwrapTemplates(root)
  expect(root.querySelector('template')).toBeTruthy()

  // template-like item with missing content hits `if (!template.content) continue`
  const host = document.createElement('div')
  const nextSibling = document.createElement('i')
  host.appendChild(nextSibling)
  const fakeTemplate = {
    hasAttribute: () => false,
    parentNode: host,
    nextSibling,
    remove: vi.fn(),
    content: undefined,
  }
  const fakeElement = {
    querySelectorAll: () => [fakeTemplate],
  } as any
  binder.__unwrapTemplates(fakeElement)
  expect(fakeTemplate.remove).toHaveBeenCalledTimes(1)
})

test('binder bindDefault short-circuits on dynamic binder', () => {
  const binder = createBinder()
  const el = document.createElement('div')

  vi.spyOn((binder as any).__ifBinder, '__bindAll').mockReturnValue(false)
  vi.spyOn((binder as any).__forBinder, '__bindAll').mockReturnValue(false)
  vi.spyOn((binder as any).__dynamicBinder, '__bindAll').mockReturnValue(true)
  const componentSpy = vi.spyOn((binder as any).__componentBinder, '__bindAll')

  binder.__bindDefault(el)

  expect(componentSpy).not.toHaveBeenCalled()
})

test('binder bindToExpression handles null expressions and once directives', () => {
  const binder = createBinder({ v: sref([1]) })
  const el = document.createElement('div')
  const mount = vi.fn(() => ({ update: vi.fn() }))
  binder.__bindToExpression({ once: true, mount } as any, el, null)
  expect(mount).not.toHaveBeenCalled()
})

test('binder bind returns early when element has r-pre', () => {
  const binder = createBinder()
  const el = document.createElement('div')
  el.setAttribute((binder as any).__pre, '')
  el.setAttribute('d', 'v')
  const mount = vi.fn()

  binder.__bind({ mount } as any, el as any, 'd')

  expect(mount).not.toHaveBeenCalled()
  expect(el.getAttribute('d')).toBe('v')
})

test('binder binds inside switch scope path', () => {
  const parser = new Parser([{ v: sref(1) }], new RegorConfig())
  const binder = new Binder(parser)
  const el = document.createElement('div')
  el.setAttribute('d', 'v')
  const id = addSwitch([{ v: sref(2) } as any])
  el.setAttribute(rswitch, id)
  expect(hasSwitch()).toBe(true)
  binder.__bind(
    {
      mount: vi.fn(),
    } as any,
    el as any,
    'd',
  )
  removeSwitch(id)
})

test('binder teleport handler covers whitespace and missing parent/target paths', () => {
  const binder = createBinder()
  const el = document.createElement('div')
  expect(binder.__handleTeleport(teleportDirective as any, el, '   ')).toBe(
    true,
  )
  expect(
    binder.__handleTeleport(teleportDirective as any, el, '#missing-x'),
  ).toBe(true)

  const target = document.createElement('div')
  target.id = 'teleport-edge'
  document.body.appendChild(target)
  try {
    // target exists but source has no parent => early true
    expect(
      binder.__handleTeleport(teleportDirective as any, el, '#teleport-edge'),
    ).toBe(true)

    const host = document.createElement('div')
    host.appendChild(el)
    expect(
      binder.__handleTeleport(teleportDirective as any, el, '#teleport-edge'),
    ).toBe(true)
  } finally {
    target.remove()
  }
})
