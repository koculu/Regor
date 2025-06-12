import { expect, test } from 'vitest'
import { computeMany, computeRef, ref } from '../../src'

// computeMany should derive values from multiple refs

test('computeMany derives value from sources', () => {
  const a = ref(1)
  const b = ref(2)
  const sum = computeMany([a, b], (x, y) => x + y)
  expect(sum()).toBe(3)
  a.value = 3
  expect(sum()).toBe(5)
  b.value = 4
  expect(sum()).toBe(7)
})

// computeRef should derive from a single ref

test('computeRef derives value from single ref', () => {
  const a = ref(2)
  const twice = computeRef(a, (v) => v * 2)
  expect(twice()).toBe(4)
  a.value = 5
  expect(twice()).toBe(10)
})
