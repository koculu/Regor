import { isTemplate, toSelector } from '../common/common'
import { RegorConfig } from './RegorConfig'

/** Adds dynamic context hosts within a prepared template. */
export const prepareContext = (
  template: Node & Partial<ParentNode>,
  config: RegorConfig = RegorConfig.getDefault(),
): void => {
  const names = config.__builtInNames
  const root = isTemplate(template) ? template.content : template
  const selector = `${toSelector(names.context)},${toSelector(names.contextAlias)},template`
  for (const element of root.querySelectorAll?.(selector) ?? []) {
    if (isTemplate(element)) {
      prepareContext(element.content, config)
      if (
        !element.hasAttribute(names.context) &&
        !element.hasAttribute(names.contextAlias)
      )
        continue
    }
    if (
      element.hasAttribute(names.is) ||
      element.hasAttribute('is') ||
      element.hasAttribute('_rcontext')
    )
      continue
    element.setAttribute('_rcontext', '')
    element.setAttribute(names.is, element.tagName)
  }
}
