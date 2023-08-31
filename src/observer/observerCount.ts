import { type AnyRef, RefOperation, type SRefSignature } from '../api/types'
import { ErrorType, getError } from '../log/errors'
import { isRef } from '../reactivity/isRef'

export const observerCount = <TValueType extends AnyRef>(
  source: TValueType,
): number => {
  if (!isRef(source))
    throw getError(ErrorType.RequiresRefSourceArgument, 'observe')
  const srefImpl = source as unknown as SRefSignature<TValueType>
  return srefImpl(undefined, undefined, RefOperation.observerCount) as number
}
