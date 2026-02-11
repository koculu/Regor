import { type Directive, type ParseResult, type Unbinder } from '../api/types'
import { isArray } from '../common/is-what'

/**
 * @internal
 */
export const refDirective: Directive = {
  once: true,
  onBind: (el: HTMLElement, result: ParseResult, expr: string): Unbinder => {
    const value = result.value()[0]
    const isAnArray = isArray(value)
    const sref = result.refs[0]
    if (isAnArray) value.push(el)
    else if (sref) sref?.(el)
    else result.context[expr] = el
    return () => {
      if (isAnArray) {
        const i = value.indexOf(el)
        if (i !== -1) value.splice(i, 1)
      } else sref?.(null)
    }
  },
}
