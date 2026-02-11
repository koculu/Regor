import { expect, test } from 'vitest'

import { batch, endBatch, observe, ref, startBatch } from '../../src'

test('batch triggers observers once', () => {
  const r = ref(0)
  let calls = 0
  observe(r, () => ++calls)
  batch(() => {
    r.value++
    r.value++
  })
  expect(calls).toBe(1)
})

test('startBatch and endBatch delay triggers', () => {
  const r = ref(0)
  let calls = 0
  observe(r, () => ++calls)
  startBatch()
  r.value++
  expect(calls).toBe(0)
  endBatch()
  expect(calls).toBe(1)
})

test('nested startBatch triggers after outer endBatch', () => {
  const r1 = ref(0)
  let calls1 = 0
  observe(r1, () => ++calls1)

  startBatch()
  r1.value++
  startBatch()
  r1.value++
  endBatch()
  expect(calls1).toBe(0)
  endBatch()
  expect(calls1).toBe(1)
})

test('nested batch calls trigger once after outer batch', () => {
  const r = ref(0)
  let calls = 0
  observe(r, () => ++calls)

  batch(() => {
    r.value++
    batch(() => {
      r.value++
    })
  })

  expect(calls).toBe(1)
})
