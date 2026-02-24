import { unbind } from './unbind'

const pendingUnbind: ChildNode[] = []
let flushScheduled = false
let flushTimer: ReturnType<typeof setTimeout> | undefined

const flushPendingUnbind = (): void => {
  flushScheduled = false
  flushTimer = undefined
  if (pendingUnbind.length === 0) return
  for (let i = 0; i < pendingUnbind.length; ++i) {
    unbind(pendingUnbind[i])
  }
  pendingUnbind.length = 0
}

export const removeNode = (node: ChildNode): void => {
  node.remove()
  pendingUnbind.push(node)
  if (!flushScheduled) {
    flushScheduled = true
    flushTimer = setTimeout(flushPendingUnbind, 1)
  }
}

export const drainUnbind = async (): Promise<void> => {
  if (pendingUnbind.length === 0 && !flushScheduled) return
  if (flushTimer) clearTimeout(flushTimer)
  flushPendingUnbind()
}
