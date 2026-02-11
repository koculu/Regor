import { type AnyRef } from '../api/types'
import { type RegorConfig } from '../app/RegorConfig'
import { type Binder } from '../bind/Binder'
import { isElseNode } from '../bind/IfBinder'
import { removeNode } from '../cleanup/removeNode'

/**
 * @internal
 */
export const getNodes = (el: HTMLElement): ChildNode[] => {
  const childNodes = isTemplate(el) ? el.content.childNodes : [el as ChildNode]
  return Array.from(childNodes).filter((x) => {
    const tagName = (x as Element)?.tagName
    return tagName !== 'SCRIPT' && tagName !== 'STYLE'
  })
}

/**
 * @internal
 */
export const bindChildNodes = (
  binder: Binder,
  childNodes: ChildNode[],
): void => {
  for (const child of childNodes) {
    // r-if binding can remove sibling else nodes
    !isElseNode(child) && binder.__bindDefault(child as Element)
  }
}

/**
 * @internal
 */
export const findElements = (
  element: Element,
  selector: string,
): NodeListOf<HTMLElement> | HTMLElement[] => {
  const result = element.querySelectorAll<HTMLElement>(selector)
  if (element.matches?.(selector)) return [element as HTMLElement, ...result]
  return result
}

/**
 * @internal
 */
export const isTemplate = (node: Element | Node): node is HTMLTemplateElement =>
  node instanceof HTMLTemplateElement

/**
 * @internal
 */
export const isElement = (node: Node): node is Element =>
  node.nodeType === Node.ELEMENT_NODE

/**
 * @internal
 * We are only interested in attribute related methods.
 * Hence it is safe to return the HTMLElement type for SVGElements.
 */
export const isHTMLElement = (node: Node): node is HTMLElement =>
  node.nodeType === Node.ELEMENT_NODE

/**
 * @internal
 */
export const isSlot = (node: Element | Node): node is HTMLSlotElement =>
  node instanceof HTMLSlotElement

/**
 * @internal
 */
export const getChildNodes = (node: Element | Node): NodeListOf<ChildNode> =>
  isTemplate(node) ? node.content.childNodes : node.childNodes

/**
 * @internal
 */
export const unmount = (start: Node, end: Node): void => {
  let next = start.nextSibling
  while (next != null && next !== end) {
    const nextSibling = next.nextSibling
    removeNode(next)
    next = nextSibling
  }
}

/**
 * @internal
 */
export const defineRefValue = (result: AnyRef, isReadOnly: boolean): void => {
  Object.defineProperty(result, 'value', {
    get() {
      return result()
    },
    set(value: unknown) {
      if (isReadOnly) throw new Error('value is readonly.')
      return result(value)
    },
    enumerable: true,
    configurable: false,
  })
}

/**
 * @internal
 */
export const isOptionDynamic = (
  option: string | undefined,
  dynamic: string,
): string | false => {
  if (!option) return false
  if (option.startsWith('[')) return option.substring(1, option.length - 1)
  const len = dynamic.length
  if (option.startsWith(dynamic)) {
    return option.substring(len, option.length - len)
  }
  return false
}

/**
 * @internal
 */
export const toSelector = (name: string): string => `[${CSS.escape(name)}]`

/**
 * @internal
 */
export const normalizeAttributeName = (
  name: string,
  config: RegorConfig,
): string => {
  if (name.startsWith('@')) {
    name = config.__builtInNames.on + ':' + name.slice(1)
  }
  if (name.includes('[')) {
    name = name.replace(/[[\]]/g, config.__builtInNames.dynamic)
  }
  return name
}

// The following functions are copied from vuejs/core.
// using the license: The MIT License (MIT)
// Copyright (c) 2018-present, Yuxi (Evan) You
const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
  const cache: Record<string, string> = Object.create(null)
  return ((str: string) => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }) as T
}

const camelizeRE = /-(\w)/g
/**
 * @internal
 */
export const camelize = cacheStringFunction((str: string): string => {
  if (!str) return str
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
})

const hyphenateRE = /\B([A-Z])/g
/**
 * @internal
 */
export const hyphenate = cacheStringFunction((str: string) => {
  if (!str) return str
  return str.replace(hyphenateRE, '-$1').toLowerCase()
})

/**
 * @internal
 */
export const capitalize = cacheStringFunction((str: string) => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
})
