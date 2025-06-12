import { expect, test } from 'vitest'
import { batch, startBatch, endBatch, ref, observe } from '../../src'

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
