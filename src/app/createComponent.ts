import {
  type CreateComponentOptions,
  type Component,
  type IRegorContext,
  type TemplateOptions,
} from '../api/types'
import { ErrorType, getError } from '../log/errors'
import { type ComponentHead } from './ComponentHead'

import { interpolate } from '../bind/interpolation'
import { toFragment } from './toFragment'
import { toJsonTemplate } from './toJsonTemplate'
import { isHTMLElement } from '../common/common'
import { isArray, isString } from '../common/is-what'

export const createComponent = <TProps = Record<any, any>>(
  context: (head: ComponentHead<TProps>) => IRegorContext,
  templateOptions: TemplateOptions | string,
  options: CreateComponentOptions | string[] = {},
): Component<TProps> => {
  if (isArray(options)) options = { props: options }
  if (isString(templateOptions)) templateOptions = { template: templateOptions }
  let svgHandled = false
  if (templateOptions.element) {
    const element = templateOptions.element as ChildNode
    element.remove()
    templateOptions.element = element
  } else if (templateOptions.selector) {
    const element = document.querySelector(templateOptions.selector)
    if (!element)
      throw getError(
        ErrorType.ComponentTemplateNotFound,
        templateOptions.selector,
      )
    element.remove()
    templateOptions.element = element
  } else if (templateOptions.template) {
    const element = document
      .createRange()
      .createContextualFragment(templateOptions.template)
    templateOptions.element = element
  } else if (templateOptions.json) {
    templateOptions.element = toFragment(
      templateOptions.json,
      templateOptions.isSVG,
      options.config,
    )
    svgHandled = true
  }
  if (!templateOptions.element)
    templateOptions.element = document.createDocumentFragment()
  if (options.useInterpolation ?? true) interpolate(templateOptions.element)
  const element = templateOptions.element
  if (
    !svgHandled &&
    ((templateOptions.isSVG ??
      (isHTMLElement(element) && element.hasAttribute?.('isSVG'))) ||
      (isHTMLElement(element) && !!element.querySelector('[isSVG]')))
  ) {
    const content = (templateOptions.element as any).content
    const nodes = content ? [...content.childNodes] : [...element.childNodes]
    const json = toJsonTemplate(nodes as Element[])
    templateOptions.element = toFragment(json, true, options.config)
  }
  return {
    context,
    template: templateOptions.element,
    inheritAttrs: options.inheritAttrs ?? true,
    props: options.props,
    defaultName: options.defaultName,
  }
}
