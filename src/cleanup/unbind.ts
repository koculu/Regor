import { bindDataSymbol } from './bindDataSymbol'

export const unbind = (node: Node): void => {
  const stack: Node[] = [node]
  while (stack.length > 0) {
    const currentNode = stack.pop() as Node
    unbindSingle(currentNode)
    for (
      let child = currentNode.lastChild;
      child != null;
      child = child.previousSibling
    ) {
      stack.push(child)
    }
  }
}

const unbindSingle = (node: Node): void => {
  const bindData = (node as any)[bindDataSymbol]
  if (!bindData) return
  const unbinders = bindData.unbinders
  for (let i = 0; i < unbinders.length; ++i) {
    unbinders[i]()
  }
  unbinders.length = 0
  ;(node as any)[bindDataSymbol] = undefined
}
