import { expect, test } from 'vitest'
import { batch, startBatch, endBatch, ref, watchEffect } from '../../src'

test('batch triggers once', () => {
  const a = ref(0)
  let calls = 0
  watchEffect(() => { a(); calls++ })
  calls = 0
  batch(() => {
    a.value++
    a.value++
  })
  expect(calls).toBe(1)
})

test('manual batch', () => {
  const a = ref(0)
  let calls = 0
  watchEffect(() => { a(); calls++ })
  calls = 0
  startBatch()
  a.value++
  a.value++
  expect(calls).toBe(0)
  endBatch()
  expect(calls).toBe(1)
})
