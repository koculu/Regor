import { camelize, isHTMLElement } from '../common/common'
import { isNullOrWhitespace } from '../common/is-what'
import { type Binder } from './Binder'

/**
 * @internal
 */
export class DirectiveElement {
  /** Contains: `['@', 'submit'], ['r-on', 'click'], ['\\@', '[dynamicKey]']` */
  __terms: string[]

  /** Contains directive flags. ['camel', 'prevent',...] */
  __flags: string[]

  __elements: HTMLElement[] = []

  constructor(terms: string[], flags: string[]) {
    this.__terms = terms
    this.__flags = flags
  }
}

export type DirectiveMap = Map<string, DirectiveElement>

/**
 * @internal
 */
export class DirectiveCollector {
  __binder: Binder
  __prefixes: string[]
  __prefixesByHead: Map<string, string[]>
  __parsedNameCache: Map<string, { terms: string[]; flags: string[] }>

  constructor(binder: Binder) {
    this.__binder = binder
    this.__prefixes = binder.__config.__getPrefixes()
    this.__parsedNameCache = new Map()
    const groups = new Map<string, string[]>()
    for (const p of this.__prefixes) {
      const key = p[0] ?? ''
      const list = groups.get(key)
      if (list) list.push(p)
      else groups.set(key, [p])
    }
    this.__prefixesByHead = groups
  }

  __parseName(name: string): { terms: string[]; flags: string[] } {
    const cached = this.__parsedNameCache.get(name)
    if (cached) return cached

    let normalized = name
    const isPropShortcut = normalized.startsWith('.')
    if (isPropShortcut) normalized = ':' + normalized.slice(1)

    const firstFlagIndex = normalized.indexOf('.')
    const rawTerms =
      firstFlagIndex < 0 ? normalized : normalized.substring(0, firstFlagIndex)
    const terms = rawTerms.split(/[:@]/)
    if (isNullOrWhitespace(terms[0])) {
      terms[0] = isPropShortcut ? '.' : normalized[0]
    }

    const flags =
      firstFlagIndex >= 0 ? normalized.slice(firstFlagIndex + 1).split('.') : []
    let hasCamel = false
    let hasProp = false
    for (let i = 0; i < flags.length; ++i) {
      const f = flags[i]
      if (!hasCamel && f === 'camel') hasCamel = true
      else if (!hasProp && f === 'prop') hasProp = true
      if (hasCamel && hasProp) break
    }
    if (hasCamel) terms[terms.length - 1] = camelize(terms[terms.length - 1])
    if (hasProp) terms[0] = '.'

    const parsed = { terms, flags }
    this.__parsedNameCache.set(name, parsed)
    return parsed
  }

  __collect(element: Element, isRecursive: boolean): DirectiveMap {
    const map = new Map<string, DirectiveElement>()
    if (!isHTMLElement(element)) return map
    const prefixesByHead = this.__prefixesByHead
    const appendDirective = (node: HTMLElement, name: string): void => {
      const candidates = prefixesByHead.get(name[0] ?? '')
      if (!candidates) return
      for (let i = 0; i < candidates.length; ++i) {
        if (!name.startsWith(candidates[i])) continue
        let item = map.get(name)
        if (!item) {
          const parsed = this.__parseName(name)
          item = new DirectiveElement(parsed.terms, parsed.flags)
          map.set(name, item)
        }
        item.__elements.push(node)
        return
      }
    }
    const processNode = (node: HTMLElement): void => {
      const attrs = node.attributes
      if (!attrs || attrs.length === 0) return
      for (let i = 0; i < attrs.length; ++i) {
        const name = attrs.item(i)?.name
        if (!name) continue
        appendDirective(node, name)
      }
    }
    processNode(element)
    if (!isRecursive || !element.firstElementChild) return map
    // IMPORTANT:
    // Keep this on native `querySelectorAll('*')`.
    // Browser engines optimize this traversal heavily and it is faster than
    // handmade JS tree walking in real DOM benchmarks.
    // Do not replace with custom recursion/stack traversal.
    const nodes = element.querySelectorAll<HTMLElement>('*')
    for (const node of nodes) {
      processNode(node)
    }
    return map
  }
}
