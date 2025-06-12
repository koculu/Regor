import { trigger } from './trigger'
import { type AnyRef } from '../api/types'
import { batchCollector } from './sref'

export const batch = (updater: () => void): void => {
  startBatch()
  try {
    updater()
  } finally {
    endBatch()
  }
}

export const startBatch = (): void => {
  if (!batchCollector.stack) batchCollector.stack = []
  batchCollector.stack.push(new Set<AnyRef>())
}

export const endBatch = (): void => {
  const stack = batchCollector.stack
  if (!stack || stack.length === 0) return
  const set = stack.pop()!
  if (stack.length) {
    const parent = stack[stack.length - 1]
    for (const ref of set) parent.add(ref)
    return
  }
  delete batchCollector.stack
  for (const ref of set) {
    try {
      trigger(ref)
    } catch (err) {
      console.error(err)
    }
  }
}
