import { type AnyRef, RefOperation, type SRefSignature } from '../api/types'
import { ErrorType, getError } from '../log/errors'
import { isRef } from './isRef'

/**
 * Re-enables observer notifications for a ref that was previously paused.
 *
 * @param source - Ref to resume.
 */
export const resume = <TValueType extends AnyRef>(source: TValueType): void => {
  if (!isRef(source))
    throw getError(ErrorType.RequiresRefSourceArgument, 'resume')
  const srefImpl = source as unknown as SRefSignature<TValueType>
  srefImpl(undefined, undefined, RefOperation.resume)
}
