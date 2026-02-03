import { RegorConfig } from '../app/RegorConfig'
import { getChildNodes } from '../common/common'
import { isNullOrWhitespace } from '../common/is-what'

/**
 * @internal
 */
export const interpolate = (element: Node, config?: RegorConfig): void => {
  if (!element) return
  const resolvedConfig = config ?? RegorConfig.getDefault()
  const builtInNames = resolvedConfig.__builtInNames
  const interpolationRegex = /(\{\{[^]*?\}\}|\[\[[^]*?\]\])/g
  const delimiters = [
    { start: '{{', end: '}}' },
    { start: '[[', end: ']]' },
  ]
  for (const textNode of getTextNodes(element, builtInNames.pre, delimiters)) {
    interpolateTextNode(textNode, builtInNames.text, interpolationRegex, delimiters)
  }
}

const interpolateTextNode = (
  textNode: Node,
  textDirective: string,
  interpolationRegex: RegExp,
  delimiters: Array<{ start: string; end: string }>,
): void => {
  const text = textNode.textContent
  if (!text) return
  const mustacheRegex = interpolationRegex
  const parts = text.split(mustacheRegex)
  if (parts.length <= 1) return

  if (textNode.parentElement?.childNodes.length === 1 && parts.length === 3) {
    const part = parts[1]
    const delimiter = getInterpolationDelimiter(part, delimiters)
    if (
      delimiter &&
      isNullOrWhitespace(parts[0]) &&
      isNullOrWhitespace(parts[2])
    ) {
      const parent = textNode.parentElement
      parent.setAttribute(
        textDirective,
        part.substring(
          delimiter.start.length,
          part.length - delimiter.end.length,
        ),
      )
      parent.innerText = ''
      return
    }
  }

  const fragment = document.createDocumentFragment()
  for (const part of parts) {
    const delimiter = getInterpolationDelimiter(part, delimiters)
    if (delimiter) {
      const spanTag = document.createElement('span')
      spanTag.setAttribute(
        textDirective,
        part.substring(
          delimiter.start.length,
          part.length - delimiter.end.length,
        ),
      )
      fragment.appendChild(spanTag)
    } else {
      fragment.appendChild(document.createTextNode(part))
    }
  }
  ;(textNode as ChildNode).replaceWith(fragment)
}

const getTextNodes = (
  node: Node,
  preDirective: string,
  delimiters: Array<{ start: string; end: string }>,
): Node[] => {
  const textNodes: Node[] = []
  const traverseTextNodes = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (delimiters.some((delimiter) => node.textContent?.includes(delimiter.start))) {
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

const getInterpolationDelimiter = (
  part: string,
  delimiters: Array<{ start: string; end: string }>,
): { start: string; end: string } | undefined =>
  delimiters.find(
    (delimiter) =>
      part.startsWith(delimiter.start) && part.endsWith(delimiter.end),
  )
