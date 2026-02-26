import { type StopObserving } from '../api/types'
import { addUnbinder } from '../cleanup/addUnbinder'
import { removeNode } from '../cleanup/removeNode'
import {
  findElements,
  getNodes,
  isTemplate,
  toSelector,
  unmount,
} from '../common/common'
import { isNullOrWhitespace, isObject, isString } from '../common/is-what'
import { type Binder } from './Binder'
import { setSwitchOwner } from './switch'

const noopStopObserving: StopObserving = () => {}

const mount = (nodes: ChildNode[], parent: HTMLElement): void => {
  for (const x of nodes) {
    const node = x.cloneNode(true)
    parent.appendChild(node)
  }
}

/**
 * @internal
 */
export class DynamicBinder {
  __binder: Binder

  __is: string

  __isSelector: string

  constructor(binder: Binder) {
    this.__binder = binder
    this.__is = binder.__config.__builtInNames.is
    this.__isSelector = toSelector(this.__is) + ', [is]'
  }

  __bindAll(element: Element): boolean {
    const isComponentElement = element.hasAttribute(this.__is)
    const elements = findElements(element, this.__isSelector)
    for (const el of elements) {
      this.__bind(el)
    }
    return isComponentElement
  }

  __bind(el: HTMLElement): void {
    let expression = el.getAttribute(this.__is)
    if (!expression) {
      expression = el.getAttribute('is')
      if (!expression) return
      if (!expression.startsWith('regor:')) {
        if (!expression.startsWith('r-')) return
        const staticName = expression.slice(2).trim().toLowerCase()
        if (!staticName) return
        const parent = el.parentNode
        if (!parent) return
        const nativeElement = document.createElement(staticName)
        for (const attr of el.getAttributeNames()) {
          if (attr === 'is') continue
          nativeElement.setAttribute(attr, el.getAttribute(attr) as string)
        }
        while (el.firstChild) nativeElement.appendChild(el.firstChild)
        parent.insertBefore(nativeElement, el)
        el.remove()
        this.__binder.__bindDefault(nativeElement)
        return
      }
      expression = `'${expression.slice(6)}'`
      el.removeAttribute('is')
    }
    el.removeAttribute(this.__is)
    this.__bindToExpression(el, expression)
  }

  __createRegion(
    el: HTMLElement,
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
      `__begin__ dynamic ${expression ?? ''}`,
    )
    parent.insertBefore(commentBegin, el)
    setSwitchOwner(commentBegin, nodes)
    nodes.forEach((x) => {
      removeNode(x)
    })
    el.remove() // if el is template, el is not in nodes list, safe to remove without unbind

    const commentEnd = document.createComment(
      `__end__ dynamic ${expression ?? ''}`,
    )
    parent.insertBefore(commentEnd, commentBegin.nextSibling)
    return {
      nodes,
      parent,
      commentBegin,
      commentEnd,
    }
  }

  __bindToExpression(el: HTMLElement, expression: string): void {
    const { nodes, parent, commentBegin, commentEnd } = this.__createRegion(
      el,
      ` => ${expression} `,
    )
    const parseResult = this.__binder.__parser.__parse(expression)
    const value = parseResult.value
    const parser = this.__binder.__parser
    const capturedContext = parser.__capture()

    const mounted = { name: '' }

    const componentChildNodes = isTemplate(el)
      ? nodes
      : [...nodes[0].childNodes]
    const refresh = (): void => {
      parser.__scoped(capturedContext, () => {
        let name = value()[0] as string
        if (isObject(name)) {
          if (!name.name) {
            // provided object does not have a name.
            // search component by instance comparison
            name = Object.entries(parser.__getComponents()).filter(
              (x) => x[1] === (name as unknown),
            )[0]?.[0]
          } else {
            name = name.name as string
          }
        }
        if (!isString(name) || isNullOrWhitespace(name)) {
          unmount(commentBegin, commentEnd)
          return
        }
        if (mounted.name === name) return
        unmount(commentBegin, commentEnd)
        const componentElement = document.createElement(name)
        for (const attr of el.getAttributeNames()) {
          if (attr === this.__is) continue
          componentElement.setAttribute(attr, el.getAttribute(attr) as string)
        }
        mount(componentChildNodes, componentElement)
        parent.insertBefore(componentElement, commentEnd)
        this.__binder.__bindDefault(componentElement)
        mounted.name = name
      })
    }

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
