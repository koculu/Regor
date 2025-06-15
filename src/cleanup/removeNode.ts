import { unbind } from './unbind'

/**
 * Removes a DOM node from the document and schedules it for unbinding. The
 * actual cleanup is deferred using `setTimeout` to avoid interfering with the
 * current execution flow.
 *
 * @param node - The node to remove and unbind.
 */
export const removeNode = (node: ChildNode): void => {
  node.remove()
  setTimeout(() => unbind(node), 1)
}
