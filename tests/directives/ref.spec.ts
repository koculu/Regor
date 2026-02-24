import { expect, test, vi } from 'vitest'

import { refDirective } from '../../src/directives/ref'

const makeParseResult = (value: unknown, sref?: (...args: unknown[]) => void) =>
  ({
    value: () => [value],
    stop: () => {},
    refs: [sref],
    context: {},
  }) as any

test('ref directive pushes element into array and removes it on unbind', () => {
  const el = document.createElement('div')
  const items: HTMLElement[] = []
  const result = makeParseResult(items)

  const unbind = refDirective.onBind!(el, result, 'x')

  expect(items).toStrictEqual([el])

  unbind()

  expect(items).toStrictEqual([])

  // second unbind should be a no-op when item no longer exists
  unbind()
  expect(items).toStrictEqual([])
})

test('ref directive calls sref on bind and unbind', () => {
  const el = document.createElement('div')
  const sref = vi.fn()
  const result = makeParseResult({}, sref)

  const unbind = refDirective.onBind!(el, result, 'target')

  expect(sref).toHaveBeenCalledWith(el)

  unbind()

  expect(sref).toHaveBeenCalledWith(null)
})

test('ref directive assigns element to context when no sref exists', () => {
  const el = document.createElement('div')
  const result = makeParseResult({})

  const unbind = refDirective.onBind!(el, result, 'myEl')

  expect(result.context.myEl).toBe(el)

  unbind()
  expect(result.context.myEl).toBe(el)
})

test('ref directive is marked as once', () => {
  expect(refDirective.once).toBe(true)
})
