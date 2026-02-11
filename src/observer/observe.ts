import {
  type AnyRef,
  type ObserveCallback,
  RefOperation,
  type SRefSignature,
  type StopObserving,
  type UnwrapRef,
} from '../api/types'
import { onUnmounted } from '../composition/onUnmounted'
import { ErrorType, getError } from '../log/errors'
import { isRef } from '../reactivity/isRef'

export const observe = <TValueType extends AnyRef>(
  source: TValueType,
  observer: ObserveCallback<UnwrapRef<TValueType>>,
  init?: boolean,
): StopObserving => {
  if (!isRef(source))
    throw getError(ErrorType.RequiresRefSourceArgument, 'observe')
  if (init) observer(source())
  const srefImpl = source as unknown as SRefSignature<UnwrapRef<TValueType>>
  const stop = srefImpl(
    undefined,
    undefined,
    RefOperation.observe,
    observer,
  ) as StopObserving
  onUnmounted(stop, true)
  return stop
}
