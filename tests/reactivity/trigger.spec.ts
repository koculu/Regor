import { expect, test } from 'vitest'

import { observe, ref, sref, trigger } from '../../src'

test('trigger does nothing for non-ref values', () => {
  expect(() => trigger(123 as never)).not.toThrow()
  expect(() => trigger({ a: 1 } as never)).not.toThrow()
})

test('trigger notifies observers of the source ref', () => {
  const state = ref({ count: 1 })
  let calls = 0
  let lastEventSource: unknown

  observe(state, (_value, eventSource) => {
    ++calls
    lastEventSource = eventSource
  })

  const source = { reason: 'manual-trigger' }
  trigger(state, source)

  expect(calls).toBe(1)
  expect(lastEventSource).toBe(source)
})

test('trigger with recursive=false does not notify nested refs', () => {
  const child = ref(0)
  const root = sref({ child })

  let childCalls = 0
  observe(child, (value) => {
    const typed: number = value
    expect(typed).toBe(0)
    ++childCalls
  })

  trigger(root, undefined, false)
  expect(childCalls).toBe(0)
})

test('trigger with recursive=true notifies nested refs in objects/arrays/sets/maps', () => {
  const objectRef = ref(1)
  const arrayRef = ref(2)
  const setRef = ref(3)
  const mapKeyRef = ref('k')
  const mapValueRef = ref(4)
  const arrContainer = sref([arrayRef])
  const setContainer = sref(new Set([setRef]))
  const mapContainer = sref(new Map([[mapKeyRef, mapValueRef]]))

  const root = sref({
    objectRef,
    arrContainer,
    setContainer,
    mapContainer,
  })

  const calls = {
    object: 0,
    array: 0,
    set: 0,
    mapKey: 0,
    mapValue: 0,
  }
  const eventSources: unknown[] = []

  observe(objectRef, (_value, eventSource) => {
    ++calls.object
    eventSources.push(eventSource)
  })
  observe(arrayRef, (_value, eventSource) => {
    ++calls.array
    eventSources.push(eventSource)
  })
  observe(setRef, (_value, eventSource) => {
    ++calls.set
    eventSources.push(eventSource)
  })
  observe(mapKeyRef, (_value, eventSource) => {
    ++calls.mapKey
    eventSources.push(eventSource)
  })
  observe(mapValueRef, (_value, eventSource) => {
    ++calls.mapValue
    eventSources.push(eventSource)
  })

  const source = { from: 'recursive-trigger' }
  trigger(root, source, true)

  expect(calls).toStrictEqual({
    object: 1,
    // arrays are traversed via both iterable and object-key paths
    array: 2,
    set: 1,
    mapKey: 1,
    mapValue: 1,
  })
  expect(eventSources.every((x) => x === source)).toBe(true)
})
