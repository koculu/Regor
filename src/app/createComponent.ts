import {
  type CreateComponentOptions,
  type Component,
  type Template,
} from '../api/types'
import { ErrorType, getError } from '../log/errors'
import { interpolate } from '../bind/interpolation'
import { toFragment } from './toFragment'
import { toJsonTemplate } from './toJsonTemplate'
import { isHTMLElement } from '../common/common'
import { isArray, isString } from '../common/is-what'
import { RegorConfig } from './RegorConfig'

export const createComponent = <TProps = Record<any, any>>(
  template: Template | string,
  options: CreateComponentOptions | string[] = {},
): Component<TProps> => {
  if (isArray(options)) options = { props: options }
  if (isString(template)) template = { template }
  const context = options.context ?? (() => ({}))
  let svgHandled = false
  if (template.element) {
    const element = template.element as ChildNode
    element.remove()
    template.element = element
  } else if (template.selector) {
    const element = document.querySelector(template.selector)
    if (!element)
      throw getError(
        ErrorType.ComponentTemplateNotFound,
        template.selector,
      )
    element.remove()
    template.element = element
  } else if (template.template) {
    const element = document
      .createRange()
      .createContextualFragment(template.template)
    template.element = element
  } else if (template.json) {
    template.element = toFragment(
      template.json,
      template.isSVG,
      options.config,
    )
    svgHandled = true
  }
  if (!template.element)
    template.element = document.createDocumentFragment()
  if (options.useInterpolation ?? true) {
    interpolate(template.element, options.config ?? RegorConfig.getDefault())
  }
  const element = template.element
  if (
    !svgHandled &&
    ((template.isSVG ??
      (isHTMLElement(element) && element.hasAttribute?.('isSVG'))) ||
      (isHTMLElement(element) && !!element.querySelector('[isSVG]')))
  ) {
    const content = (template.element as any).content
    const nodes = content ? [...content.childNodes] : [...element.childNodes]
    const json = toJsonTemplate(nodes as Element[])
    template.element = toFragment(json, true, options.config)
  }
  return {
    context,
    template: template.element,
    inheritAttrs: options.inheritAttrs ?? true,
    props: options.props,
    defaultName: options.defaultName,
  }
}
