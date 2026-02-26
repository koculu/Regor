import { type Directive } from '../api/types'
import { getBindData } from '../cleanup/getBindData'
import { isUndefined } from '../common/is-what'

/**
 * @internal
 */
const updateShow = (el: HTMLElement, values: any[]): void => {
  const data = getBindData(el).data
  let originalDisplay = data._ord as string
  if (isUndefined(originalDisplay)) {
    originalDisplay = data._ord = el.style.display
  }
  const isVisible = !!values[0]
  if (isVisible) el.style.display = originalDisplay
  else el.style.display = 'none'
}

export const showDirective: Directive = {
  mount: () => ({
    update: ({ el, values }) => {
      updateShow(el, values as any[])
    },
  }),
}
