import { type Directive } from '../api/types'
import { patchProp } from './prop'

/**
 * @internal
 */
export const valueDirective: Directive = {
  onChange: (el: HTMLElement, values: any[]) => {
    patchProp(el, 'value', values[0])
  },
}
