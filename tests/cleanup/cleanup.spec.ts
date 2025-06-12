import { expect, test, vi } from 'vitest'
import { addUnbinder, getBindData, removeNode, unbind } from '../../src'

// Ensure unbinders are stored on nodes

test('addUnbinder and getBindData manage unbinders', () => {
  const el = document.createElement('div')
  const fn = vi.fn()
  addUnbinder(el, fn)
  expect(getBindData(el).unbinders).toContain(fn)
})

// Unbind should call unbinders on node tree

test('unbind calls stored unbinders', () => {
  const parent = document.createElement('div')
  const child = document.createElement('span')
  parent.appendChild(child)
  const fn1 = vi.fn()
  const fn2 = vi.fn()
  addUnbinder(parent, fn1)
  addUnbinder(child, fn2)
  unbind(parent)
  expect(fn1).toHaveBeenCalled()
  expect(fn2).toHaveBeenCalled()
})

// removeNode removes node and unbinds asynchronously

test('removeNode removes node and unbinds later', () => {
  vi.useFakeTimers()
  const parent = document.createElement('div')
  const child = document.createElement('span')
  parent.appendChild(child)
  const fn = vi.fn()
  addUnbinder(child, fn)
  removeNode(child)
  expect(parent.contains(child)).toBe(false)
  vi.runAllTimers()
  expect(fn).toHaveBeenCalled()
  vi.useRealTimers()
})
