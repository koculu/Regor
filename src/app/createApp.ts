import { ErrorType, getError } from '../log/errors'
import {
  type Scope,
  type IRegorContext,
  type TemplateOptions,
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

export const createApp = <TRegorContext extends IRegorContext>(
  context: TRegorContext | Scope<TRegorContext>,
  templateOptions: TemplateOptions | string = { selector: '#app' },
  config?: RegorConfig,
): App<TRegorContext> => {
  if (isString(templateOptions))
    templateOptions = { selector: '#app', template: templateOptions }
  if (isScope(context)) context = context.context
  const root = templateOptions.element
    ? templateOptions.element
    : templateOptions.selector
    ? document.querySelector(templateOptions.selector)
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

  if (templateOptions.template) {
    const element = document
      .createRange()
      .createContextualFragment(templateOptions.template)
    cleanRoot()
    appendChildren(element.childNodes)
    templateOptions.element = element
  } else if (templateOptions.json) {
    const element = toFragment(
      templateOptions.json,
      templateOptions.isSVG,
      config,
    )
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
