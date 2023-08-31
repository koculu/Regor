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
  if (!batchCollector.set) batchCollector.set = new Set<AnyRef>()
}

export const endBatch = (): void => {
  const set = batchCollector.set
  if (!set) return
  delete batchCollector.set
  for (const ref of set) {
    try {
      trigger(ref)
    } catch (err) {
      console.error(err)
    }
  }
}
