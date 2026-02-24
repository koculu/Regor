import { expect, test, vi } from 'vitest'

import { RegorConfig } from '../../src/app/RegorConfig'
import { Binder } from '../../src/bind/Binder'
import { unbind } from '../../src/cleanup/unbind'
import { warningHandler } from '../../src/log/warnings'
import { Parser } from '../../src/parser/Parser'
import { ref } from '../../src/reactivity/ref'

const createBinder = (context: Record<string, unknown> = {}) => {
  const parser = new Parser([context], new RegorConfig())
  return new Binder(parser)
}

test('if binder warns when binding expression is missing', () => {
  const binder = createBinder()
  const ifBinder = (binder as any).__ifBinder
  const ifName = ifBinder.__if as string

  const el = document.createElement('div')
  el.setAttribute(ifName, '')

  const warnSpy = vi
    .spyOn(warningHandler, 'warning')
    .mockImplementation(() => undefined)
  try {
    ifBinder.__bind(el)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(String(warnSpy.mock.calls[0][0])).toContain(
      `${ifName} binding expression is missing`,
    )
  } finally {
    warnSpy.mockRestore()
  }
})

test('if binder cleans elseif observers on unbind', () => {
  const flag = ref(false)
  const binder = createBinder({ flag })
  const ifBinder = (binder as any).__ifBinder
  const ifName = ifBinder.__if as string
  const elseifName = ifBinder.__elseif as string

  const root = document.createElement('div')
  root.innerHTML = `<div ${ifName}="flag">if</div><div ${elseifName}="flag">elseif</div>`

  const elseifEl = root.children[1] as HTMLElement
  const refresh = vi.fn()

  ifBinder.__collectElses(elseifEl, refresh)

  flag(true)
  expect(refresh).toHaveBeenCalledTimes(1)

  const begin = Array.from(root.childNodes).find(
    (x) =>
      x.nodeType === Node.COMMENT_NODE &&
      (x as Comment).data.includes('__begin__ :elseif'),
  ) as Comment | undefined

  expect(begin).toBeDefined()
  unbind(begin!)

  flag(false)
  expect(refresh).toHaveBeenCalledTimes(1)
})
