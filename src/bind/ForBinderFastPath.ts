import { type Directive } from '../api/types'
import { camelize } from '../common/common'
import { htmlDirective } from '../directives/html'
import { type Binder } from './Binder'

type PlannedBinding = {
  nodeIndex: number
  attrName: string
  directive: Directive
  option?: string
  flags?: string[]
}

/**
 * r-for fast path for non-structural templates:
 * - no components
 * - no template nodes
 * - all directive bindings are allowed except structural loop/branch directives
 */
export class ForBinderFastPath {
  __bindings: PlannedBinding[]

  constructor(bindings: PlannedBinding[]) {
    this.__bindings = bindings
  }

  static __create(
    binder: Binder,
    nodes: ChildNode[],
  ): ForBinderFastPath | undefined {
    const parser = binder.__parser
    const config = binder.__config
    const builtInNames = config.__builtInNames
    const blockedBuiltIns = new Set<string>([
      builtInNames.for,
      builtInNames.if,
      builtInNames.else,
      builtInNames.elseif,
      builtInNames.pre,
    ])
    const directiveMap = config.__directiveMap
    const contextComponents = parser.__getComponents()
    if (
      Object.keys(contextComponents).length > 0 ||
      config.__componentsUpperCase.size > 0
    ) {
      return undefined
    }
    const collector = binder.__directiveCollector

    const bindings: PlannedBinding[] = []
    let nodeIndex = 0

    const stack: Node[] = []
    for (let i = nodes.length - 1; i >= 0; --i) {
      stack.push(nodes[i])
    }
    while (stack.length > 0) {
      const node = stack.pop() as Node
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (el.tagName === 'TEMPLATE') return undefined
        if (el.tagName.includes('-')) return undefined
        const tagNameUpper = camelize(el.tagName).toUpperCase()
        if (
          config.__componentsUpperCase.has(tagNameUpper) ||
          contextComponents[tagNameUpper]
        ) {
          return undefined
        }
        const attrs = el.attributes
        for (let i = 0; i < attrs.length; ++i) {
          const attrName = attrs.item(i)?.name
          if (!attrName) continue
          if (blockedBuiltIns.has(attrName)) return undefined
          const { terms, flags } = collector.__parseName(attrName)
          const [name, option] = terms
          const directive = directiveMap[attrName] ?? directiveMap[name]
          if (!directive) continue
          if (directive === htmlDirective) return undefined
          bindings.push({
            nodeIndex,
            attrName,
            directive,
            option,
            flags,
          })
        }
        ++nodeIndex
      }

      const children = node.childNodes
      for (let i = children.length - 1; i >= 0; --i) {
        stack.push(children[i])
      }
    }

    if (bindings.length === 0) return undefined
    return new ForBinderFastPath(bindings)
  }

  __bind(binder: Binder, nodes: ChildNode[]): void {
    const elements: HTMLElement[] = []
    const stack: Node[] = []
    for (let i = nodes.length - 1; i >= 0; --i) {
      stack.push(nodes[i])
    }
    while (stack.length > 0) {
      const node = stack.pop() as Node
      if (node.nodeType === Node.ELEMENT_NODE) {
        elements.push(node as HTMLElement)
      }
      const children = node.childNodes
      for (let i = children.length - 1; i >= 0; --i) {
        stack.push(children[i])
      }
    }
    for (let i = 0; i < this.__bindings.length; ++i) {
      const binding = this.__bindings[i]
      const el = elements[binding.nodeIndex]
      if (!el) continue
      binder.__bind(
        binding.directive,
        el,
        binding.attrName,
        false,
        binding.option,
        binding.flags,
      )
    }
  }
}
