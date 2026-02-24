import { expect, test, vi } from 'vitest'

import { RegorConfig } from '../../src/app/RegorConfig'
import { Binder } from '../../src/bind/Binder'
import { unbind } from '../../src/cleanup/unbind'
import { teleportDirective } from '../../src/directives/teleport'
import { Parser } from '../../src/parser/Parser'

const createBinder = () => {
  const parser = new Parser([{}], new RegorConfig())
  return new Binder(parser)
}

test('binder unwraps template content into parent and binds children', () => {
  const binder = createBinder()
  const root = document.createElement('div')
  root.innerHTML = '<template><span id="moved">x</span></template>'

  binder.__unwrapTemplates(root)

  expect(root.querySelector('template')).toBeNull()
  expect(root.querySelector('#moved')?.textContent).toBe('x')
})

test('binder logs when attribute directive is not found', () => {
  const binder = createBinder()
  const el = document.createElement('div')
  ;(binder.__directiveCollector as any).__collect = () =>
    new Map([
      [
        'x-unknown',
        {
          __terms: ['x-unknown', undefined],
          __elements: [el],
          __flags: [],
        },
      ],
    ])
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    binder.__bindAttributes(el, false)
    expect(spy).toHaveBeenCalled()
  } finally {
    spy.mockRestore()
  }
})

test('binder teleport installs placeholder unbinder that removes teleported node', () => {
  const binder = createBinder()
  const host = document.createElement('div')
  const target = document.createElement('div')
  target.id = 'tele-target'
  const el = document.createElement('section')
  host.appendChild(el)
  document.body.appendChild(target)
  try {
    binder.__bindToExpression(teleportDirective, el, '#tele-target')
    expect(target.contains(el)).toBe(true)

    const placeholder = host.childNodes[0] as Comment
    unbind(placeholder)
    expect(target.contains(el)).toBe(false)
  } finally {
    target.remove()
  }
})
