import { expect, test, vi } from 'vitest'

import { ComponentHead } from '../../src/app/ComponentHead'
import {
  peekScope,
  popScope,
  pushScope,
  setScope,
} from '../../src/composition/stack'

test('component head emits custom events from source element', () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  host.appendChild(start)
  host.appendChild(end)
  const head = new ComponentHead({}, host, [], start, end)
  const spy = vi.fn()
  host.addEventListener('save', spy)

  head.emit('save', { x: 1 })

  expect(spy).toHaveBeenCalledTimes(1)
  expect((spy.mock.calls[0][0] as CustomEvent).detail).toEqual({ x: 1 })
})

test('component head unmount removes nodes between markers and calls unmounted hooks', async () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const n1 = document.createElement('span')
  const n2 = document.createElement('span')
  const end = document.createComment('e')
  host.appendChild(start)
  host.appendChild(n1)
  host.appendChild(n2)
  host.appendChild(end)

  const stop = vi.fn()
  const ctx = {} as any
  pushScope()
  setScope(ctx)
  ;(peekScope() as any).onUnmounted.push(stop)
  popScope()
  const head = new ComponentHead({}, host, [ctx], start, end)

  head.unmount()
  await new Promise((resolve) => setTimeout(resolve, 5))

  expect(host.contains(n1)).toBe(false)
  expect(stop).toHaveBeenCalledTimes(1)
})

test('component head findContext returns first matching parent context', () => {
  class ParentContext {
    constructor(readonly value: number) {}
  }
  class OtherContext {
    readonly name = 'other'
  }

  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const other = new OtherContext()
  const parent1 = new ParentContext(1)
  const parent2 = new ParentContext(2)
  const head = new ComponentHead(
    {},
    host,
    [other, parent1, parent2 as any],
    start,
    end,
  )

  expect(head.findContext(ParentContext)).toBe(parent1)
  expect(head.findContext(ParentContext, 1)).toBe(parent2)
  expect(head.findContext(ParentContext, 2)).toBeUndefined()
  expect(head.findContext(ParentContext, -1)).toBeUndefined()
  expect(head.findContext(Date)).toBeUndefined()
})

test('component head requireContext throws when parent context is missing', () => {
  class ParentContext {}

  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const head = new ComponentHead({}, host, [], start, end)

  expect(() => head.requireContext(ParentContext)).toThrow(
    `${ParentContext} was not found in the context stack at occurrence 0.`,
  )
  expect(() => head.requireContext(ParentContext, 1)).toThrow(
    `${ParentContext} was not found in the context stack at occurrence 1.`,
  )
})
