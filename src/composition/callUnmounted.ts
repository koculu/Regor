import { type IRegorContext } from '../api/types'
import { getScope } from './stack'

/**
 * @internal
 */
export const callUnmounted = (context: IRegorContext): void => {
  const callbacks = getScope(context)?.onUnmounted
  callbacks?.forEach((x) => {
    x()
  })
  context.unmounted?.()
}
