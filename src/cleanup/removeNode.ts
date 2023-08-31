import { unbind } from './unbind'

export const removeNode = (node: ChildNode): void => {
  node.remove()
  setTimeout(() => unbind(node), 1)
}
