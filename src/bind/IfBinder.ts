import { type StopObserving } from '../api/types'
import { addUnbinder } from '../cleanup/addUnbinder'
import { removeNode } from '../cleanup/removeNode'
import {
  bindChildNodes,
  findElements,
  getNodes,
  toSelector,
  unmount,
} from '../common/common'
import { warning, WarningType } from '../log/warnings'
import { type Binder } from './Binder'
import { setSwitchOwner } from './switch'

interface CollectedElses {
  mount: () => void
  unmount: () => void
  isTrue: () => boolean
  isMounted: boolean
}
const noopStopObserving: StopObserving = () => {}
const mount = (
  nodes: ChildNode[],
  binder: Binder,
  parent: ParentNode,
  end: Node,
): void => {
  const childNodes: ChildNode[] = []
  for (const x of nodes) {
    const node = x.cloneNode(true)
    parent.insertBefore(node, end)
    childNodes.push(node as ChildNode)
  }
  bindChildNodes(binder, childNodes)
}

const ifMarker = Symbol('r-if')
const elseMarker = Symbol('r-else')

/**
 * @internal
 */
export const isElseNode = (node: any): boolean => node[elseMarker] === 1

/**
 * @internal
 */
export class IfBinder {
  __binder: Binder

  __if: string
  __ifSelector: string
  __else: string
  __elseif: string
  __for: string
  __pre: string

  constructor(binder: Binder) {
    this.__binder = binder
    this.__if = binder.__config.__builtInNames.if
    this.__ifSelector = toSelector(binder.__config.__builtInNames.if)
    this.__else = binder.__config.__builtInNames.else
    this.__elseif = binder.__config.__builtInNames.elseif
    this.__for = binder.__config.__builtInNames.for
    this.__pre = binder.__config.__builtInNames.pre
  }

  __hasAncestorWithAttribute(element: Element, name: string): boolean {
    let node: Element | null = element.parentElement

    while (node !== null && node !== document.documentElement) {
      if (node.hasAttribute(name)) {
        return true
      }
      node = node.parentElement
    }

    return false
  }

  __bindAll(element: Element): boolean {
    const isIfElement = element.hasAttribute(this.__if)
    const elements = findElements(element, this.__ifSelector)
    for (const el of elements) {
      this.__bind(el)
    }
    return isIfElement
  }

  __isProcessedOrMark(el: any): boolean {
    // avoid unnecessary for binding for nested if's
    if (el[ifMarker]) return true
    el[ifMarker] = true
    findElements(el, this.__ifSelector).forEach(
      (x: any) => (x[ifMarker] = true),
    )
    return false
  }

  __bind(el: HTMLElement): void {
    if (
      el.hasAttribute(this.__pre) ||
      this.__isProcessedOrMark(el) ||
      // if elements should only be mounted after for's are mounted.
      this.__hasAncestorWithAttribute(el, this.__for)
    )
      return
    const expression = el.getAttribute(this.__if)
    if (!expression) {
      warning(WarningType.MissingBindingExpression, this.__if, el)
      return
    }
    el.removeAttribute(this.__if)
    this.__bindToExpression(el, expression)
  }

  __createRegion(
    el: HTMLElement,
    type: 'if' | 'else' | 'elseif',
    expression?: string,
  ): {
    nodes: ChildNode[]
    parent: Element
    commentBegin: Comment
    commentEnd: Comment
  } {
    const nodes = getNodes(el)
    const parent = el.parentNode as Element
    const commentBegin = document.createComment(
      `__begin__ :${type}${expression ?? ''}`,
    )
    parent.insertBefore(commentBegin, el)
    setSwitchOwner(commentBegin, nodes)
    nodes.forEach((x) => {
      removeNode(x)
    })
    el.remove() // if el is template, el is not in nodes list, safe to remove without unbind
    if (type !== 'if') (el as any)[elseMarker] = 1
    const commentEnd = document.createComment(
      `__end__ :${type}${expression ?? ''}`,
    )
    parent.insertBefore(commentEnd, commentBegin.nextSibling)
    return {
      nodes,
      parent,
      commentBegin,
      commentEnd,
    }
  }

  __collectElses(el: HTMLElement, refresh: () => void): CollectedElses[] {
    if (!el) return []
    const nextElement = el.nextElementSibling as HTMLElement
    if (el.hasAttribute(this.__else)) {
      el.removeAttribute(this.__else)
      const { nodes, parent, commentBegin, commentEnd } = this.__createRegion(
        el,
        'else',
      )
      return [
        {
          mount: () => {
            mount(nodes, this.__binder, parent, commentEnd)
          },
          unmount: () => {
            unmount(commentBegin, commentEnd)
          },
          isTrue: () => true,
          isMounted: false,
        },
      ]
    } else {
      const expression = el.getAttribute(this.__elseif)
      if (!expression) return []
      el.removeAttribute(this.__elseif)
      const { nodes, parent, commentBegin, commentEnd } = this.__createRegion(
        el,
        'elseif',
        ` => ${expression} `,
      )

      const parseResult = this.__binder.__parser.__parse(expression)
      const value = parseResult.value
      const remainingElses = this.__collectElses(nextElement, refresh)

      let stopObserver = noopStopObserving
      const unbinder = (): void => {
        parseResult.stop()
        stopObserver()
        stopObserver = noopStopObserving
      }
      addUnbinder(commentBegin, unbinder)

      stopObserver = parseResult.subscribe(refresh)

      return [
        {
          mount: () => {
            mount(nodes, this.__binder, parent, commentEnd)
          },
          unmount: () => {
            unmount(commentBegin, commentEnd)
          },
          isTrue: () => !!value()[0],
          isMounted: false,
        },
        ...remainingElses,
      ]
    }
  }

  __bindToExpression(el: HTMLElement, expression: string): void {
    const nextElement = el.nextElementSibling as HTMLElement
    const { nodes, parent, commentBegin, commentEnd } = this.__createRegion(
      el,
      'if',
      ` => ${expression} `,
    )
    const parseResult = this.__binder.__parser.__parse(expression)
    const value = parseResult.value
    let isIfMounted = false
    const parser = this.__binder.__parser
    const capturedContext = parser.__capture()

    const refresh = (): void => {
      parser.__scoped(capturedContext, () => {
        if (value()[0]) {
          if (!isIfMounted) {
            mount(nodes, this.__binder, parent, commentEnd)
            isIfMounted = true
          }
          collectedElses.forEach((x) => {
            x.unmount()
            x.isMounted = false
          })
        } else {
          unmount(commentBegin, commentEnd)
          isIfMounted = false
          let caughtTrue = false
          for (const elseBlock of collectedElses) {
            if (!caughtTrue && elseBlock.isTrue()) {
              if (!elseBlock.isMounted) {
                elseBlock.mount()
                elseBlock.isMounted = true
              }
              caughtTrue = true
            } else {
              elseBlock.unmount()
              elseBlock.isMounted = false
            }
          }
        }
      })
    }

    const collectedElses = this.__collectElses(nextElement, refresh)

    let stopObserver = noopStopObserving
    const unbinder = (): void => {
      parseResult.stop()
      stopObserver()
      stopObserver = noopStopObserving
    }
    addUnbinder(commentBegin, unbinder)

    refresh()
    stopObserver = parseResult.subscribe(refresh)
  }
}
