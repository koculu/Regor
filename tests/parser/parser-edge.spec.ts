import { expect, test, vi } from 'vitest'

import { RegorConfig } from '../../src/app/RegorConfig'
import { warningHandler } from '../../src/log/warnings'
import { Parser } from '../../src/parser/Parser'

test('parser warns on eval errors and keeps parse result stable', () => {
  const parser = new Parser(
    [
      {
        crash: () => {
          throw new Error('boom')
        },
      },
    ],
    new RegorConfig(),
  )
  const spy = vi.spyOn(warningHandler, 'warning').mockImplementation(() => {})
  try {
    const result = parser.__parse('crash()')
    expect(result.value().length).toBe(1)
    expect(result.value()[0]).toBeUndefined()
    expect(spy).toHaveBeenCalled()
  } finally {
    spy.mockRestore()
  }
})

test('parser warns on parse errors and still returns parse result shell', () => {
  const parser = new Parser([{}], new RegorConfig())
  const spy = vi.spyOn(warningHandler, 'warning').mockImplementation(() => {})
  try {
    const result = parser.__parse('a +')
    expect(Array.isArray(result.value())).toBe(true)
    expect(spy).toHaveBeenCalled()
  } finally {
    spy.mockRestore()
  }
})

test('parser returns deduplicated component selectors across contexts', () => {
  const parser = new Parser(
    [{ components: { C2: {} } }, { components: { C1: {}, C2: {} } }],
    new RegorConfig(),
  )
  expect(parser.__getComponentSelectors()).toEqual(['C1', 'C2'])
})
