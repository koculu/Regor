import { bindDataSymbol } from './bindDataSymbol'

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
