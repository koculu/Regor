import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()

/** Happy DOM can mis-resolve selectors in the form:
 * `template[name='x'], template[\#x]` and return the wrong template.
 * Patch querySelector/querySelectorAll for this exact shape in tests only. */
const patchTemplateNameOrHashSelectorForHappyDom = () => {
  const proto = Element.prototype as Element & {
    __regorTemplateSelectorPatched?: boolean
  }
  if (proto.__regorTemplateSelectorPatched) return
  proto.__regorTemplateSelectorPatched = true

  const nativeQuerySelector = Element.prototype.querySelector
  const nativeQuerySelectorAll = Element.prototype.querySelectorAll

  const parseTemplateNameOrHash = (selector: string): string | null => {
    const match = selector.match(
      /^template\[name=(['"])([^'"]+)\1\],\s*template\[\\#\2\]$/,
    )
    return match ? match[2] : null
  }

  const findTemplate = (
    root: Element,
    name: string,
  ): HTMLTemplateElement | null => {
    const byName = nativeQuerySelector.call(
      root,
      `template[name='${name}']`,
    ) as HTMLTemplateElement | null
    if (byName) return byName

    const allTemplates = nativeQuerySelectorAll.call(
      root,
      'template',
    ) as NodeListOf<HTMLTemplateElement>
    for (const template of allTemplates) {
      const attrs = template.getAttributeNames()
      if (attrs.includes('#' + name) || attrs.includes(name)) return template
    }
    return null
  }

  Element.prototype.querySelector = function (
    selector: string,
  ): Element | null {
    const name = parseTemplateNameOrHash(selector)
    if (!name) return nativeQuerySelector.call(this, selector)
    return findTemplate(this, name)
  }

  Element.prototype.querySelectorAll = function (
    selector: string,
  ): NodeListOf<Element> {
    const name = parseTemplateNameOrHash(selector)
    if (!name) return nativeQuerySelectorAll.call(this, selector)
    const template = findTemplate(this, name)
    return (template ? [template] : []) as unknown as NodeListOf<Element>
  }
}

patchTemplateNameOrHashSelectorForHappyDom()
