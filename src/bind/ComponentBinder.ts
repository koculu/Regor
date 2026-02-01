import { isNullOrWhitespace } from '../common/is-what'
import { type Component, type IRegorContext } from '../api/types'
import { addUnbinder } from '../cleanup/addUnbinder'
import { type Binder } from './Binder'
import {
  bindChildNodes,
  camelize,
  getChildNodes,
  hyphenate,
  isElement,
  isSlot,
  isTemplate,
  normalizeAttributeName,
} from '../common/common'
import { addSwitch, refSwitch, removeSwitch, rswitch } from './switch'
import { propsDirective } from '../directives/props'
import { propsOnceDirective } from '../directives/props-once'
import { ComponentHead } from '../app/ComponentHead'
import { useScope } from '../composition/useScope'
import { isRef } from '../reactivity/isRef'
import { entangle } from '../reactivity/entangle'
import { unref } from '../reactivity/unref'
import { callUnmounted } from '../composition/callUnmounted'
import { unbind } from '../cleanup/unbind'
import { callMounted } from '../composition/callMounted'
import { singlePropDirective } from '../directives/single-prop'

/**
 * @internal
 */
export class ComponentBinder {
  __binder: Binder

  __inherit: string

  constructor(binder: Binder) {
    this.__binder = binder
    this.__inherit = binder.__config.__builtInNames.inherit
  }

  __bindAll(element: Element): void {
    this.__unwrapComponents(element)
  }

  __unwrapComponents(element: Element): void {
    const binder = this.__binder
    const parser = binder.__parser
    const registeredComponents = binder.__config.__components
    const registeredComponentsUpperCase = binder.__config.__componentsUpperCase
    const contextComponents = parser.__getComponents()
    const selector = [
      ...registeredComponents.keys(),
      ...Object.keys(contextComponents),
      ...[...registeredComponents.keys()].map(hyphenate),
      ...[...Object.keys(contextComponents)].map(hyphenate),
    ].join(',')
    if (isNullOrWhitespace(selector)) return
    const list = element.querySelectorAll<HTMLElement>(selector)
    const components = element.matches?.(selector)
      ? [element as HTMLElement, ...list]
      : list
    for (const component of components) {
      if (component.hasAttribute(binder.__pre)) continue
      const parent = component.parentNode
      if (!parent) continue
      const nextSibling = component.nextSibling
      const tagName = camelize(component.tagName).toUpperCase()
      const contextComponent: Component | undefined = contextComponents[tagName]
      const registeredComponent =
        contextComponent ?? registeredComponentsUpperCase.get(tagName)
      if (!registeredComponent) continue
      const templateElement = registeredComponent.template
      if (!templateElement) continue

      const componentParent = component.parentElement
      if (!componentParent) continue
      const startOfComponent = new Comment(
        ' begin component: ' + component.tagName,
      )
      const endOfComponent = new Comment(' end component: ' + component.tagName)
      componentParent.insertBefore(startOfComponent, component)
      component.remove()
      const propsName = binder.__config.__builtInNames.props
      const propsOnceName = binder.__config.__builtInNames.propsOnce
      const bindName = binder.__config.__builtInNames.bind

      const getProps = (
        component: HTMLElement,
        capturedContext: any[],
      ): Record<any, any> => {
        const props: Record<any, any> = {}
        const hasProps = component.hasAttribute(propsName)
        const hasPropsOnce = component.hasAttribute(propsOnceName)
        parser.__scoped(capturedContext, () => {
          parser.__push(props)
          if (hasProps) binder.__bind(propsDirective, component, propsName)
          if (hasPropsOnce)
            binder.__bind(propsOnceDirective, component, propsOnceName)

          let definedProps = registeredComponent.props
          if (!definedProps || definedProps.length === 0) return
          definedProps = definedProps.map(camelize)

          for (const name of definedProps.concat(definedProps.map(hyphenate))) {
            const value = component.getAttribute(name)
            if (value === null) continue
            props[camelize(name)] = value
            component.removeAttribute(name)
          }

          const map = binder.__directiveCollector.__collect(component, false)
          for (const [attrName, item] of map.entries()) {
            const [name, option] = item.__terms
            if (!option) continue
            if (!definedProps.includes(camelize(option))) continue
            if (name !== '.' && name !== ':' && name !== bindName) continue
            binder.__bind(
              singlePropDirective,
              component,
              attrName,
              true,
              option,
              item.__flags,
            )
          }
        })
        return props
      }

      const capturedContext = [...parser.__capture()]
      const createComponentCtx = (): {
        componentCtx: IRegorContext
        head: ComponentHead<Record<any, any>>
      } => {
        const props = getProps(component, capturedContext)
        const head = new ComponentHead(
          props,
          component,
          capturedContext,
          startOfComponent,
          endOfComponent,
        )
        const componentCtx = useScope(() => {
          return (
            registeredComponent.context(head) ?? ({} satisfies IRegorContext)
          )
        }).context
        if (head.autoProps) {
          for (const [key, propsValue] of Object.entries(props)) {
            if (key in componentCtx) {
              const compValue = componentCtx[key]
              if (compValue === propsValue) continue
              // the component author didn't provide property using head.props
              // if entangle enabled, entangle the props[ref] to the componentCtx[ref] to provide parent-child data sync.
              if (head.entangle && isRef(compValue) && isRef(propsValue)) {
                addUnbinder(startOfComponent, entangle(propsValue, compValue))
              } else if (isRef(compValue)) {
                compValue(propsValue)
              } else componentCtx[key] = unref(propsValue)
            } else componentCtx[key] = propsValue
          }
          head.onAutoPropsAssigned?.()
        }
        return { componentCtx, head }
      }
      const { componentCtx, head } = createComponentCtx()

      const childNodes = [...getChildNodes(templateElement)]
      const len = childNodes.length
      const isEmptyComponent = component.childNodes.length === 0
      const expandSlot = (slot: HTMLSlotElement): void => {
        const parent = slot.parentElement as HTMLElement
        if (isEmptyComponent) {
          // fallback slot content
          for (const slotChild of [...slot.childNodes]) {
            parent.insertBefore(slotChild, slot)
          }
          return
        }
        let name = slot.name
        if (isNullOrWhitespace(name)) {
          name = slot.getAttributeNames().filter((x) => x.startsWith('#'))[0]
          if (isNullOrWhitespace(name)) {
            name = 'default'
          } else name = name.substring(1)
        }
        let compTemplate = component.querySelector(
          `template[name='${name}'], template[\\#${name}]`,
        )
        if (!compTemplate && name === 'default') {
          compTemplate = component.querySelector('template:not([name])')
          if (
            compTemplate &&
            compTemplate.getAttributeNames().filter((x) => x.startsWith('#'))
              .length > 0
          )
            compTemplate = null
        }

        const createSwitchContext = (childNodes: ChildNode[]): void => {
          if (!head.enableSwitch) return
          // we can create the isolated props context for the slot here
          // however it is too early to bind because of r-if and r-for directives
          parser.__scoped(capturedContext, () => {
            parser.__push(componentCtx)
            const props = getProps(slot, parser.__capture())
            parser.__scoped(capturedContext, () => {
              parser.__push(props)
              const switchContext = parser.__capture()
              const id = addSwitch(switchContext)
              for (const child of childNodes) {
                if (!isElement(child)) continue
                child.setAttribute(rswitch, id)
                refSwitch(id)
                addUnbinder(child, () => {
                  removeSwitch(id)
                })
              }
            })
          })
        }
        if (compTemplate) {
          const childNodes = [...getChildNodes(compTemplate)]
          for (const slotChild of childNodes) {
            parent.insertBefore(slotChild, slot)
          }
          createSwitchContext(childNodes)
        } else {
          if (name !== 'default') {
            // fallback slot content
            for (const slotChild of [...getChildNodes(slot)]) {
              parent.insertBefore(slotChild, slot)
            }
            return
          }
          const childNodes = [...getChildNodes(component)].filter(
            (x) => !isTemplate(x),
          )
          for (const slotChild of childNodes) {
            parent.insertBefore(slotChild, slot)
          }
          createSwitchContext(childNodes)
        }
      }

      const expandNestedSlots = (node: Node): void => {
        if (!isElement(node)) return
        const slots = node.querySelectorAll<HTMLSlotElement>('slot')
        if (isSlot(node)) {
          expandSlot(node)
          node.remove()
          return
        }
        for (const slot of slots) {
          expandSlot(slot)
          slot.remove()
        }
      }
      const expandSlots = (): void => {
        for (let i = 0; i < len; ++i) {
          childNodes[i] = childNodes[i].cloneNode(true) as ChildNode
          parent.insertBefore(childNodes[i], nextSibling)
          expandNestedSlots(childNodes[i])
        }
      }

      expandSlots()

      componentParent.insertBefore(endOfComponent, nextSibling)
      const transferAttributesToTheComponentChild = (): void => {
        if (!registeredComponent.inheritAttrs) return
        let inheritorChildNodes = childNodes.filter(
          (x) => x.nodeType === Node.ELEMENT_NODE,
        )
        if (inheritorChildNodes.length > 1)
          inheritorChildNodes = inheritorChildNodes.filter((x) =>
            (x as Element).hasAttribute(this.__inherit),
          )
        const inheritor = inheritorChildNodes[0] as HTMLElement
        if (!inheritor) return

        for (const attrName of component.getAttributeNames()) {
          if (attrName === propsName || attrName === propsOnceName) continue
          const value = component.getAttribute(attrName) as string
          if (attrName === 'class') {
            inheritor.classList.add(...value.split(' '))
          } else if (attrName === 'style') {
            const inheritorStyle = inheritor.style
            const componentStyle = component.style
            for (const s of componentStyle) {
              inheritorStyle.setProperty(s, componentStyle.getPropertyValue(s))
            }
          } else {
            inheritor.setAttribute(
              normalizeAttributeName(attrName, binder.__config),
              value,
            )
          }
        }
      }

      const clearUnusedAttributes = (): void => {
        for (const attrName of component.getAttributeNames()) {
          if (
            !attrName.startsWith('@') &&
            !attrName.startsWith(binder.__config.__builtInNames.on)
          )
            component.removeAttribute(attrName)
        }
      }

      const bindComponent = (): void => {
        transferAttributesToTheComponentChild()
        clearUnusedAttributes()
        parser.__push(componentCtx)
        binder.__bindAttributes(component, false)
        componentCtx.$emit = head.emit
        bindChildNodes(binder, childNodes)
        addUnbinder(component, () => {
          callUnmounted(componentCtx)
        })
        addUnbinder(startOfComponent, () => {
          unbind(component)
        })
        callMounted(componentCtx)
      }
      parser.__scoped(capturedContext, bindComponent)
    }
  }
}
