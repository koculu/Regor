import { type OnUnmounted } from '../api/types'
import { peekScope } from './stack'

export const onUnmounted = (
  onUnmounted: OnUnmounted,
  noThrow?: boolean,
): void => {
  peekScope(noThrow)?.onUnmounted.push(onUnmounted)
}
