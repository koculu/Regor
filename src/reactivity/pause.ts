import { type AnyRef, RefOperation, type SRefSignature } from '../api/types'
import { ErrorType, getError } from '../log/errors'
import { isRef } from './isRef'

/**
 * Temporarily disables observer notifications for the given ref.
 *
 * @param source - Ref to pause.
 */
export const pause = <TValueType extends AnyRef>(source: TValueType): void => {
  if (!isRef(source))
    throw getError(ErrorType.RequiresRefSourceArgument, 'pause')
  const srefImpl = source as unknown as SRefSignature<TValueType>
  srefImpl(undefined, undefined, RefOperation.pause)
}
