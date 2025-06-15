import { bindDataSymbol } from './bindDataSymbol'

/**
 * Recursively removes Regor bindings from a node and all of its descendants.
 * Each node's unbinders are executed to detach event listeners and other bound
 * data.
 *
 * @param node - Root node from which to remove bindings.
 */
export const unbind = (node: Node): void => {
  const queue: any[] = [node]

  while (queue.length > 0) {
    const currentElement = queue.shift()
    unbindSingle(currentElement)
    const childNodes = currentElement.childNodes
    if (!childNodes) continue
    for (const item of childNodes) {
      queue.push(item)
    }
  }
}

const unbindSingle = (node: Node): void => {
  const bindData = (node as any)[bindDataSymbol]
  if (!bindData) return
  for (const unbinder of bindData.unbinders) {
    unbinder()
  }
  bindData.unbinders.splice(0)
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete (node as any)[bindDataSymbol]
}
