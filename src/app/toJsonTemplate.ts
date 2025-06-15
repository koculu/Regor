import { type JSONTemplate } from '../api/types'
import { getChildNodes } from '../common/common'
import { isArray } from '../common/is-what'

/**
 * Converts DOM elements into the JSON template format used by Regor. This
 * transformation is handy for serializing templates or rendering in strict CSP
 * scenarios where inline HTML is not allowed.
 *
 * @param node - DOM element or array of elements to convert.
 * @returns JSON representation of the supplied DOM nodes.
 */
export const toJsonTemplate = (
  node: Element | Element[],
): JSONTemplate | JSONTemplate[] => {
  if (isArray(node)) {
    return node.map((x) => toJsonTemplate(x) as JSONTemplate)
  }
  const json: JSONTemplate = {}
  if (node.tagName) json.t = node.tagName
  else {
    if (node.nodeType === Node.COMMENT_NODE) json.n = Node.COMMENT_NODE
    if (node.textContent) json.d = node.textContent
    return json
  }
  const attrNames = node.getAttributeNames()
  if (attrNames.length > 0) {
    json.a = Object.fromEntries(
      attrNames.map((name) => [name, node.getAttribute(name)]),
    ) as Record<any, any>
  }

  const childNodes = getChildNodes(node)
  if (childNodes.length > 0) {
    json.c = [...childNodes].map(
      (child) => toJsonTemplate(child as Element) as JSONTemplate,
    )
  }
  return json
}
