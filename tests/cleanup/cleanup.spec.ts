import { expect, test, vi } from 'vitest'
import { addUnbinder, getBindData, removeNode, unbind } from '../../src'

 test('addUnbinder and unbind', () => {
  const el = document.createElement('div')
  const bd = getBindData(el)
  const fn = vi.fn()
  addUnbinder(el, fn)
  expect(getBindData(el)).toBe(bd)
  expect(bd.unbinders.length).toBe(1)
  unbind(el)
  expect(fn).toHaveBeenCalledTimes(1)
  expect(bd.unbinders.length).toBe(0)
 })

test('removeNode removes and unbinds', () => {
  vi.useFakeTimers()
  const parent = document.createElement('div')
  const child = document.createElement('span')
  parent.appendChild(child)
  const fn = vi.fn()
  addUnbinder(child, fn)
  removeNode(child)
  expect(parent.contains(child)).toBe(false)
  vi.runAllTimers()
  expect(fn).toHaveBeenCalledTimes(1)
  vi.useRealTimers()
})
