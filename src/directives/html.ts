import { type Directive } from '../api/types'
import { isFunction } from '../common/is-what'

/**
 * @internal
 */
const updateHtml = (el: HTMLElement, values: any[]): void => {
  /*
  trusted security policy with sanitizer
  sample: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/require-trusted-types-for

  enable CSP: require-trusted-types-for:
  <meta http-equiv="Content-Security-Policy" content="require-trusted-types-for 'script';">
   */
  const [value, replacer] = values
  if (isFunction(replacer)) replacer(el, value)
  else el.innerHTML = value?.toString()
}

export const htmlDirective: Directive = {
  mount: () => ({
    update: ({ el, values }) => {
      updateHtml(el, values as any[])
    },
  }),
}
