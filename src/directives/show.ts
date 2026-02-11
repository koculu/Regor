import { type Directive } from '../api/types'
import { getBindData } from '../cleanup/getBindData'
import { isUndefined } from '../common/is-what'

/**
 * @internal
 */
export const showDirective: Directive = {
  onChange: (el: HTMLElement, values: any[]) => {
    const data = getBindData(el).data
    let originalDisplay = data._ord
    if (isUndefined(originalDisplay)) {
      originalDisplay = data._ord = el.style.display
    }
    const isVisible = !!values[0]
    if (isVisible) el.style.display = originalDisplay
    else el.style.display = 'none'
  },
}
