import { expect, test } from 'vitest'

import { sref } from '../../src'
import { type MountListItem } from '../../src/api/types'
import { ForBinderFastPath } from '../../src/bind/ForBinderFastPath'
import { ForBinderKeyedDiff } from '../../src/bind/ForBinderKeyedDiff'

const createMountItem = (value: { id: string }, parent: HTMLElement) => {
  const node = document.createTextNode(value.id)
  parent.appendChild(node)
  const item: MountListItem = {
    items: [node],
    value,
    index: sref(0),
    order: 0,
  }
  return item
}

test('ForBinderFastPath: bails when context component matches element tag', () => {
  const contextComponents = Object.create({
    FOO: {},
  }) as Record<string, unknown>

  const binder = {
    __parser: {
      __getComponents: () => contextComponents,
    },
    __config: {
      __builtInNames: {
        for: 'r-for',
        if: 'r-if',
        else: 'r-else',
        elseif: 'r-else-if',
        pre: 'r-pre',
      },
      __directiveMap: {},
      __componentsUpperCase: new Map(),
    },
    __directiveCollector: {
      __parseName: (name: string) => ({ terms: [name], flags: undefined }),
    },
  } as any

  const nodes = [document.createElement('foo')]
  const fastPath = ForBinderFastPath.__create(binder, nodes)
  expect(fastPath).toBeUndefined()
})

test('ForBinderFastPath: bails when context has own components', () => {
  const binder = {
    __parser: {
      __getComponents: () => ({ Card: {} }),
    },
    __config: {
      __builtInNames: {
        for: 'r-for',
        if: 'r-if',
        else: 'r-else',
        elseif: 'r-else-if',
        pre: 'r-pre',
      },
      __directiveMap: {},
      __componentsUpperCase: new Map(),
    },
    __directiveCollector: {
      __parseName: (name: string) => ({ terms: [name], flags: undefined }),
    },
  } as any

  const fastPath = ForBinderFastPath.__create(binder, [
    document.createElement('div'),
  ])
  expect(fastPath).toBeUndefined()
})

test('ForBinderKeyedDiff: reordered middle uses LIS patch path', () => {
  const host = document.createElement('div')
  const endAnchor = document.createComment('end')
  host.appendChild(endAnchor)

  const a = { id: 'a' }
  const b = { id: 'b' }
  const c = { id: 'c' }
  const d = { id: 'd' }
  const oldItems = [
    createMountItem(a, host),
    createMountItem(b, host),
    createMountItem(c, host),
    createMountItem(d, host),
  ]

  const next = [d, b, c, a]
  const removed: string[] = []
  const mounted: string[] = []

  const patched = ForBinderKeyedDiff.__patch({
    oldItems,
    newValues: next,
    getKey: (v) => (v as { id: string }).id,
    isSameValue: (x, y) => x === y,
    mountNewValue: (_i, value) => {
      mounted.push((value as { id: string }).id)
      return createMountItem(value as { id: string }, host)
    },
    removeMountItem: (item) => {
      removed.push((item.value as { id: string }).id)
    },
    endAnchor,
  })

  expect(patched?.map((x) => (x.value as { id: string }).id)).toStrictEqual([
    'd',
    'b',
    'c',
    'a',
  ])
  expect(mounted).toStrictEqual([])
  expect(removed).toStrictEqual([])
})

test('ForBinderKeyedDiff: complex reorder exercises LIS binary-search branch', () => {
  const host = document.createElement('div')
  const endAnchor = document.createComment('end')
  host.appendChild(endAnchor)

  const a = { id: 'a' }
  const b = { id: 'b' }
  const c = { id: 'c' }
  const d = { id: 'd' }
  const e = { id: 'e' }
  const oldItems = [
    createMountItem(a, host),
    createMountItem(b, host),
    createMountItem(c, host),
    createMountItem(d, host),
    createMountItem(e, host),
  ]

  const next = [e, b, c, d, a]

  const patched = ForBinderKeyedDiff.__patch({
    oldItems,
    newValues: next,
    getKey: (v) => (v as { id: string }).id,
    isSameValue: (x, y) => x === y,
    mountNewValue: (_i, value) =>
      createMountItem(value as { id: string }, host),
    removeMountItem: () => {},
    endAnchor,
  })

  expect(patched?.map((x) => (x.value as { id: string }).id)).toStrictEqual([
    'e',
    'b',
    'c',
    'd',
    'a',
  ])
})
