import { expect, test, vi } from 'vitest'
import { onMounted, onUnmounted, useScope } from '../../src'
import { callMounted } from '../../src/composition/callMounted'
import { callUnmounted } from '../../src/composition/callUnmounted'

 test('mounted and unmounted callbacks run', () => {
  const m = vi.fn()
  const u = vi.fn()
  const scope = useScope(() => {
    onMounted(m)
    onUnmounted(u)
    return {}
  })
  callMounted(scope.context)
  expect(m).toHaveBeenCalledTimes(1)
  callUnmounted(scope.context)
  expect(u).toHaveBeenCalledTimes(1)
 })
