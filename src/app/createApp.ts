import { ErrorType, getError } from '../log/errors'
import {
  type Scope,
  type IRegorContext,
  type Template,
  type App,
} from '../api/types'
import { Binder } from '../bind/Binder'
import { Parser } from '../parser/Parser'
import { RegorConfig } from './RegorConfig'
import { addUnbinder } from '../cleanup/addUnbinder'
import { callMounted } from '../composition/callMounted'
import { callUnmounted } from '../composition/callUnmounted'
import { interpolate } from '../bind/interpolation'
import { removeNode } from '../cleanup/removeNode'
import { toFragment } from './toFragment'
import { unbind } from '../cleanup/unbind'
import { isScope } from '../composition/useScope'
import { isElement } from '../common/common'
import { isString } from '../common/is-what'

/**
 * Initializes a Regor application by binding the given context to a DOM element
 * defined by the template. The function optionally accepts a configuration
 * object and returns an interface to unmount or unbind the application.
 *
 * @param context - Regor context or scope that drives the application.
 * @param template - Template configuration or selector of the root element.
 * @param config - Optional Regor configuration.
 * @returns The created application instance.
 */
export const createApp = <TRegorContext extends IRegorContext>(
  context: TRegorContext | Scope<TRegorContext>,
  template: Template | string = { selector: '#app' },
  config?: RegorConfig,
): App<TRegorContext> => {
  if (isString(template)) template = { selector: '#app', template }
  if (isScope(context)) context = context.context
  const root = template.element
    ? template.element
    : template.selector
      ? document.querySelector(template.selector)
      : null
  if (!root || !isElement(root)) throw getError(ErrorType.AppRootElementMissing)
  if (!config) config = RegorConfig.getDefault()

  const cleanRoot = (): void => {
    for (const child of [...root.childNodes]) {
      removeNode(child)
    }
  }
  const appendChildren = (childNodes: NodeListOf<ChildNode>): void => {
    for (const child of childNodes) {
      root.appendChild(child)
    }
  }

  if (template.template) {
    const element = document
      .createRange()
      .createContextualFragment(template.template)
    cleanRoot()
    appendChildren(element.childNodes)
    template.element = element
  } else if (template.json) {
    const element = toFragment(template.json, template.isSVG, config)
    cleanRoot()
    appendChildren(element.childNodes)
  }

  if (config.useInterpolation) interpolate(root, config)
  const app = new RegorApp(context, root, config)
  app.__bind()
  addUnbinder(root, () => {
    callUnmounted(context)
  })
  callMounted(context)
  return {
    context,
    unmount: () => {
      removeNode(root)
    },
    unbind: () => {
      unbind(root)
    },
  }
}

class RegorApp {
  __context: IRegorContext

  __root: Element

  __config: RegorConfig

  __parser: Parser

  __binder: Binder

  constructor(context: IRegorContext, root: Element, config: RegorConfig) {
    this.__context = context
    this.__root = root
    this.__config = config
    this.__parser = new Parser([context], config)
    this.__binder = new Binder(this.__parser)
  }

  __bind(): void {
    this.__binder.__bindDefault(this.__root)
  }
}
