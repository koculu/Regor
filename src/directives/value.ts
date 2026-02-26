import { type Directive } from '../api/types'
import { patchProp } from './prop'

/**
 * @internal
 */
export const valueDirective: Directive = {
  mount: () => ({
    update: ({ el, values }) => {
      patchProp(el, 'value', values[0])
    },
  }),
}
