import { expect, test } from 'vitest'
import { computeMany, computeRef, ref } from '../../src'

test('computeMany sums refs', () => {
  const r1 = ref(1)
  const r2 = ref(2)
  const c = computeMany([r1, r2], (a, b) => a + b)
  expect(c()).toBe(3)
  r1(2)
  expect(c()).toBe(4)
})

test('computeRef computes from ref', () => {
  const r = ref(2)
  const c = computeRef(r, v => v * 3)
  expect(c()).toBe(6)
  r(4)
  expect(c()).toBe(12)
})
