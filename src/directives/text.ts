import { isMap, isObject, isSet } from '../common/is-what'
import { type Directive } from '../api/types'
import { flatten } from '../misc/flatten'

/**
 * @internal
 */
export const textDirective: Directive = {
  onChange: (el: HTMLElement, values: any[]) => {
    const value = values[0]
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent#differences_from_innertext
    // Note: order is important: [isSet,isMap] should come before [isObject].
    el.textContent = isSet(value)
      ? JSON.stringify(flatten([...value]))
      : isMap(value)
      ? JSON.stringify(flatten([...value]))
      : isObject(value)
      ? JSON.stringify(flatten(value))
      : value?.toString() ?? ''
  },
}
