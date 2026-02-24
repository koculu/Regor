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
