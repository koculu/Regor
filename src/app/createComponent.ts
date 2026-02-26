import {
  type Component,
  type CreateComponentOptions,
  IRegorContext,
  type Template,
} from '../api/types'
import { interpolate } from '../bind/interpolation'
import { isHTMLElement } from '../common/common'
import { isArray, isString } from '../common/is-what'
import { ErrorType, getError } from '../log/errors'
import { preprocess } from './preprocess-template'
import { RegorConfig } from './RegorConfig'
import { toFragment } from './toFragment'
import { toJsonTemplate } from './toJsonTemplate'

/**
 * Creates a reusable Regor component definition.
 *
 * `createComponent` prepares a template once, then Regor clones/binds it for each
 * component instance in the app.
 *
 * @typeParam TContext - Component context type.
 * @param template - Component template source:
 * - inline HTML string
 * - `Template` object (`template`, `element`, `selector`, or `json`)
 * @param options - Component options (`context`, `props`, `inheritAttrs`, etc.).
 * You can also pass `string[]` as shorthand for `props`.
 *
 * @returns Component definition usable in app/component `components`.
 *
 * @example
 * ```ts
 * const UserCard = createComponent(
 *   `<article><h3 r-text="name"></h3></article>`,
 *   {
 *     props: ['name'],
 *     context: (head) => ({
 *       name: head.props.name ?? 'Anonymous',
 *     }),
 *   },
 * )
 * ```
 *
 * @example
 * ```ts
 * // Props shorthand:
 * const CounterLabel = createComponent(
 *   `<span r-text="value"></span>`,
 *   ['value'],
 * )
 * ```
 */
export const createComponent = <
  TContext extends IRegorContext | object = IRegorContext,
>(
  template: Template | string,
  options: CreateComponentOptions<TContext> | string[] = {},
): Component<TContext> => {
  if (isArray(options)) options = { props: options }
  if (isString(template)) template = { template }
  const context = options.context ?? (() => ({}) as TContext)
  let svgHandled = false
  if (template.element) {
    const element = template.element as ChildNode
    element.remove()
    template.element = element
  } else if (template.selector) {
    const element = document.querySelector(template.selector)
    if (!element)
      throw getError(ErrorType.ComponentTemplateNotFound, template.selector)
    element.remove()
    template.element = element
  } else if (template.template) {
    const element = document
      .createRange()
      .createContextualFragment(preprocess(template.template))
    template.element = element
  } else if (template.json) {
    template.element = toFragment(template.json, template.isSVG, options.config)
    svgHandled = true
  }
  if (!template.element) template.element = document.createDocumentFragment()
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
    const content = (element as Node & { content?: Node }).content
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
  } satisfies Component<TContext>
}
