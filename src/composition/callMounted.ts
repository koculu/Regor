import { type IRegorContext } from '../api/types'
import { getScope } from './stack'

/**
 * @internal
 */
export const callMounted = (context: IRegorContext): void => {
  const callbacks = getScope(context)?.onMounted
  callbacks?.forEach((x) => {
    x()
  })
  context.mounted?.()
}
