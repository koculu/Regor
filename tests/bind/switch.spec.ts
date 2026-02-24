import { expect, test } from 'vitest'

import { unbind } from '../../src'
import {
  addSwitch,
  getSwitch,
  hasSwitch,
  refSwitch,
  removeSwitch,
  setSwitchOwner,
} from '../../src/bind/switch'

test('switch registry tracks refs and removes context at refcount zero', () => {
  const ctx = [{ x: 1 }]
  const id = addSwitch(ctx)
  expect(hasSwitch()).toBe(true)
  expect(getSwitch(id)).toBe(ctx)

  refSwitch(id)
  removeSwitch(id)
  expect(getSwitch(id)).toBeUndefined()
})

test('setSwitchOwner deduplicates switches and releases on owner unbind', () => {
  const id1 = addSwitch([{ one: 1 }])
  const id2 = addSwitch([{ two: 2 }])

  const owner = document.createComment('owner')
  const host = document.createElement('div')
  host.innerHTML = `<div><i r-switch="${id1}"></i><b r-switch="${id1}"></b><u r-switch="${id2}"></u></div>`

  setSwitchOwner(owner, [host])
  expect(getSwitch(id1)).toBeDefined()
  expect(getSwitch(id2)).toBeDefined()

  unbind(owner)
  expect(getSwitch(id1)).toBeUndefined()
  expect(getSwitch(id2)).toBeUndefined()
})

test('switch remove decrements refcount without deleting until zero', () => {
  const id = addSwitch([{ keep: true }])
  refSwitch(id)
  refSwitch(id)

  removeSwitch(id)
  expect(getSwitch(id)).toBeDefined()

  removeSwitch(id)
  expect(getSwitch(id)).toBeUndefined()
})

test('setSwitchOwner is a no-op when no switch ids are present', () => {
  const owner = document.createComment('owner')
  const plain = document.createElement('div')
  plain.innerHTML = '<span>plain</span>'

  expect(() => setSwitchOwner(owner, [plain])).not.toThrow()
})
