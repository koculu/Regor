import { expect, test, vi } from 'vitest'

import { RegorConfig } from '../../src/app/RegorConfig'
import { Binder } from '../../src/bind/Binder'
import { warningHandler } from '../../src/log/warnings'
import { Parser } from '../../src/parser/Parser'
import { ref } from '../../src/reactivity/ref'

const createBinder = (context: Record<string, unknown> = {}) => {
  const parser = new Parser([context], new RegorConfig())
  return new Binder(parser)
}

test('for binder warns on missing binding expression and invalid expression', () => {
  const binder = createBinder()
  const fb = (binder as any).__forBinder
  const forName = fb.__for as string
  const warnSpy = vi
    .spyOn(warningHandler, 'warning')
    .mockImplementation(() => {})
  try {
    const elMissing = document.createElement('div')
    elMissing.setAttribute(forName, '')
    fb.__bindFor(elMissing)

    const elInvalid = document.createElement('div')
    elInvalid.setAttribute(forName, 'item ???')
    fb.__bindFor(elInvalid)

    expect(warnSpy).toHaveBeenCalledTimes(2)
  } finally {
    warnSpy.mockRestore()
  }
})

test('for binder parse config supports destructuring and #index aliases', () => {
  const binder = createBinder()
  const fb = (binder as any).__forBinder
  const parsed = fb.__parseForPath('[k,v,#i] in list')
  expect(parsed.list).toBe('list')
  const item = parsed.createContext(['a', 'b'], 3)
  expect(item.ctx.k).toBe('a')
  expect(item.ctx.v).toBe('b')
  expect(item.ctx.i()).toBe(3)
})

test('for binder returns iterable range for number source and handles detached nodes', () => {
  const list = ref(3)
  const binder = createBinder({ list })
  const fb = (binder as any).__forBinder
  expect([...fb.__getIterable(3 as any)]).toEqual([1, 2, 3])

  const detached = document.createElement('div')
  expect(() => fb.__bindForToPath(detached, 'x in list')).not.toThrow()
})
