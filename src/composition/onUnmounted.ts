import { type OnUnmounted } from '../api/types'
import { peekScope } from './stack'

/**
 * Registers a callback to be executed when the current scope is unmounted.
 * Useful for cleaning up resources such as event listeners.
 *
 * @param onUnmounted - Cleanup function to execute on unmount.
 * @param noThrow - When `true`, silently ignores missing scope errors.
 */
export const onUnmounted = (
  onUnmounted: OnUnmounted,
  noThrow?: boolean,
): void => {
  peekScope(noThrow)?.onUnmounted.push(onUnmounted)
}
