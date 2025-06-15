import { type AnyRef, RefOperation, type SRefSignature } from '../api/types'
import { ErrorType, getError } from '../log/errors'
import { isRef } from '../reactivity/isRef'

/**
 * Returns the number of observers currently attached to the given ref.
 *
 * @param source - Ref whose observer count should be queried.
 */
export const observerCount = <TValueType extends AnyRef>(
  source: TValueType,
): number => {
  if (!isRef(source))
    throw getError(ErrorType.RequiresRefSourceArgument, 'observerCount')
  const srefImpl = source as unknown as SRefSignature<TValueType>
  return srefImpl(undefined, undefined, RefOperation.observerCount) as number
}
