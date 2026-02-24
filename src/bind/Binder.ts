import type { Directive, ParseResult, StopObserving } from '../api/types'
import { type RegorConfig } from '../app/RegorConfig'
import { addUnbinder } from '../cleanup/addUnbinder'
import { removeNode } from '../cleanup/removeNode'
import {
  bindChildNodes,
  camelize,
  isOptionDynamic,
  isTemplate,
} from '../common/common'
import { isNullOrWhitespace } from '../common/is-what'
import { teleportDirective } from '../directives/teleport'
// import { warning, WarningType } from '../log/warnings'
import { type Parser } from '../parser/Parser'
import { ComponentBinder } from './ComponentBinder'
import { DirectiveCollector } from './DirectiveCollector'
import { DynamicBinder } from './DynamicBinder'
import { ForBinder } from './ForBinder'
import { IfBinder } from './IfBinder'
import { getSwitch, hasSwitch, rswitch } from './switch'

/**
 * @internal
 */
export class Binder {
  __parser: Parser
  __ifBinder: IfBinder
  __forBinder: ForBinder
  __dynamicBinder: DynamicBinder
  __componentBinder: ComponentBinder
  __directiveCollector: DirectiveCollector
  __config: RegorConfig
  __pre: string
  __dynamic: string

  constructor(parser: Parser) {
    this.__parser = parser
    this.__config = parser.__config
    this.__forBinder = new ForBinder(this)
    this.__ifBinder = new IfBinder(this)
    this.__dynamicBinder = new DynamicBinder(this)
    this.__componentBinder = new ComponentBinder(this)
    this.__directiveCollector = new DirectiveCollector(this)
    this.__pre = this.__config.__builtInNames.pre
    this.__dynamic = this.__config.__builtInNames.dynamic
  }

  __unwrapTemplates(element: Element): void {
    const templates = isTemplate(element)
      ? [element]
      : element.querySelectorAll('template')
    for (const template of templates) {
      if (template.hasAttribute(this.__pre)) continue
      const parent = template.parentNode
      if (!parent) continue
      const nextSibling = template.nextSibling
      template.remove()
      if (!template.content) continue
      const childNodes = [...template.content.childNodes]
      for (const child of childNodes) {
        parent.insertBefore(child, nextSibling)
      }
      bindChildNodes(this, childNodes)
    }
  }

  __bindDefault(element: Element): void {
    if (
      element.nodeType !== Node.ELEMENT_NODE ||
      element.hasAttribute(this.__pre)
    )
      return
    if (this.__ifBinder.__bindAll(element)) return
    if (this.__forBinder.__bindAll(element)) return
    if (this.__dynamicBinder.__bindAll(element)) return
    this.__componentBinder.__bindAll(element)
    this.__unwrapTemplates(element)
    this.__bindAttributes(element, true)
  }

  __bindAttributes(element: Element, isRecursive: boolean): void {
    const map = this.__directiveCollector.__collect(element, isRecursive)

    const directiveMap = this.__config.__directiveMap
    for (const [attribute, item] of map.entries()) {
      const [name, option] = item.__terms
      const directive = directiveMap[attribute] ?? directiveMap[name]
      if (!directive) {
        console.error('directive not found:', name)
        continue
      }
      const elements = item.__elements
      for (let i = 0; i < elements.length; ++i) {
        const el = elements[i]
        this.__bind(directive, el, attribute, false, option, item.__flags)
      }
    }
  }

  __bind(
    config: Directive,
    el: HTMLElement,
    attribute: string,
    _noWarning?: boolean,
    option?: string,
    flags?: string[],
  ): void {
    if (el.hasAttribute(this.__pre)) return
    const bindExpression = el.getAttribute(attribute)
    el.removeAttribute(attribute)
    const getParentSwitch = (el: HTMLElement): string | null => {
      let cursor: HTMLElement | null = el
      while (cursor) {
        const switchId = cursor.getAttribute(rswitch)
        if (switchId) return switchId
        cursor = cursor.parentElement
      }
      return null
    }
    if (hasSwitch()) {
      const switchId = getParentSwitch(el)
      if (switchId) {
        this.__parser.__scoped(getSwitch(switchId), () => {
          this.__bindToExpression(config, el, bindExpression, option, flags)
        })
        return
      }
    }
    this.__bindToExpression(config, el, bindExpression, option, flags)
  }

  __handleTeleport(
    config: Directive,
    el: HTMLElement,
    valueExpression: string | null,
  ): boolean {
    if (config !== teleportDirective) return false
    if (isNullOrWhitespace(valueExpression)) return true
    const teleportTo = document.querySelector(valueExpression)
    if (teleportTo) {
      const parent = el.parentElement
      if (!parent) return true
      const placeholder = new Comment(`teleported => '${valueExpression}'`)
      parent.insertBefore(placeholder, el)
      ;(el as HTMLElement & { teleportedFrom: Node }).teleportedFrom =
        placeholder
      ;(placeholder as Comment & { teleportedTo: HTMLElement }).teleportedTo =
        el
      addUnbinder(placeholder, () => {
        removeNode(el)
      })
      teleportTo.appendChild(el)
    }
    return true
  }

  __bindToExpression(
    config: Directive,
    el: HTMLElement,
    valueExpression: string | null,
    option?: string,
    flags?: string[],
  ): void {
    if (el.nodeType !== Node.ELEMENT_NODE || valueExpression == null) return
    if (this.__handleTeleport(config, el, valueExpression)) return
    const result = this.__parser.__parse(
      valueExpression,
      config.isLazy,
      config.isLazyKey,
      config.collectRefObj,
      config.once,
    )
    const stopObserverList = [] as StopObserving[]
    const hasOnChange = !!config.onChange
    const unbinder = (): void => {
      result.stop()
      dynamicOption?.stop()
      for (let i = 0; i < stopObserverList.length; ++i) {
        stopObserverList[i]()
      }
      stopObserverList.length = 0
    }
    addUnbinder(el, unbinder)

    const dynamicOptionExpression = isOptionDynamic(option, this.__dynamic)
    let dynamicOption: ParseResult | undefined
    if (dynamicOptionExpression) {
      dynamicOption = this.__parser.__parse(
        camelize(dynamicOptionExpression),
        undefined,
        undefined,
        undefined,
        config.once,
      )
    }
    const dynamicOpt = dynamicOption
    const hasDynamicOption = dynamicOpt != null
    let previousValues: any[] = result.value()
    let previousOption: any = hasDynamicOption
      ? dynamicOption!.value()[0]
      : option

    if (!config.once && hasOnChange) {
      const stopObserving = (
        result.subscribe
          ? result.subscribe(() => {
              const preValues = previousValues
              const preOption = previousOption
              const nextValues = result.value()
              const nextOption = hasDynamicOption
                ? dynamicOpt.value()[0]
                : option
              previousValues = nextValues
              previousOption = nextOption
              config.onChange?.(
                el,
                nextValues,
                preValues,
                nextOption,
                preOption,
                flags,
              )
            })
          : () => {}
      ) as StopObserving
      stopObserverList.push(stopObserving)
      if (dynamicOpt) {
        const stopObserving = (
          dynamicOpt.subscribe
            ? dynamicOpt.subscribe(() => {
                const preOption = previousOption
                const nextValues = result.value()
                const nextOption = dynamicOpt.value()[0]
                previousValues = nextValues
                previousOption = nextOption
                config.onChange?.(
                  el,
                  nextValues,
                  preOption,
                  nextOption,
                  preOption,
                  flags,
                )
              })
            : () => {}
        ) as StopObserving
        stopObserverList.push(stopObserving)
      }
    }
    if (config.onBind)
      stopObserverList.push(
        config.onBind(
          el,
          result,
          valueExpression,
          option,
          dynamicOption,
          flags,
        ),
      )
    config.onChange?.(
      el,
      previousValues,
      undefined,
      previousOption,
      undefined,
      flags,
    )
  }
}
