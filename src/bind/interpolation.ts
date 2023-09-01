import { RegorConfig } from '../app/RegorConfig'
import { getChildNodes } from '../common/common'
import { isNullOrWhitespace } from '../common/is-what'

/**
 * @internal
 */
export const interpolate = (element: Node, config?: RegorConfig): void => {
  if (!element) return
  const builtInNames = (config ?? RegorConfig.getDefault()).__builtInNames
  for (const textNode of getTextNodes(element, builtInNames.pre)) {
    interpolateTextNode(textNode, builtInNames.text)
  }
}

const interpolationRegex = /({{[^]*?}})/g
const interpolateTextNode = (textNode: Node, textDirective: string): void => {
  const text = textNode.textContent
  if (!text) return
  const mustacheRegex = interpolationRegex
  const parts = text.split(mustacheRegex)
  if (parts.length <= 1) return

  if (textNode.parentElement?.childNodes.length === 1 && parts.length === 3) {
    const part = parts[1]
    if (
      isNullOrWhitespace(parts[0]) &&
      isNullOrWhitespace(parts[2]) &&
      part.startsWith('{{') &&
      part.endsWith('}}')
    ) {
      const parent = textNode.parentElement
      parent.setAttribute(textDirective, part.substring(2, part.length - 2))
      parent.innerText = ''
      return
    }
  }

  const fragment = document.createDocumentFragment()
  for (const part of parts) {
    if (part.startsWith('{{') && part.endsWith('}}')) {
      const spanTag = document.createElement('span')
      spanTag.setAttribute(textDirective, part.substring(2, part.length - 2))
      fragment.appendChild(spanTag)
    } else {
      fragment.appendChild(document.createTextNode(part))
    }
  }
  ;(textNode as ChildNode).replaceWith(fragment)
}

const getTextNodes = (node: Node, preDirective: string): Node[] => {
  const textNodes: Node[] = []
  const traverseTextNodes = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.includes('{{')) {
        textNodes.push(node)
      }
    } else {
      if ((node as Element)?.hasAttribute?.(preDirective)) return
      for (const child of getChildNodes(node)) {
        traverseTextNodes(child)
      }
    }
  }
  traverseTextNodes(node)
  return textNodes
}
