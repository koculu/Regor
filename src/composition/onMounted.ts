import { type OnMounted } from '../api/types'
import { peekScope } from './stack'

/**
 * Registers a callback to be executed when the current scope is mounted. If no
 * scope is active, the callback is ignored.
 *
 * @param onMounted - Function to run after the scope is mounted.
 */
export const onMounted = (onMounted: OnMounted): void => {
  peekScope()?.onMounted.push(onMounted)
}
