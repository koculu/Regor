import { expect, test } from 'vitest'

import { onMounted, onUnmounted, useScope } from '../../src'
import { callMounted } from '../../src/composition/callMounted'
import { callUnmounted } from '../../src/composition/callUnmounted'

test('onMounted and onUnmounted callbacks execute', () => {
  const calls: string[] = []
  const scope = useScope(() => {
    onMounted(() => calls.push('mount'))
    onUnmounted(() => calls.push('unmount'))
    return {}
  })
  callMounted(scope.context)
  expect(calls).toEqual(['mount'])
  callUnmounted(scope.context)
  expect(calls).toEqual(['mount', 'unmount'])
})
