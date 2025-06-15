import {
  RefOperation,
  type AnyRef,
  type ObserveCallback,
  type SRefSignature,
  type StopObserving,
  type UnwrapRef,
} from '../api/types'
import { onUnmounted } from '../composition/onUnmounted'
import { ErrorType, getError } from '../log/errors'
import { isRef } from '../reactivity/isRef'

/**
 * Attaches an observer callback to a ref. The observer is called whenever the
 * ref's value changes. A function to stop observing is returned.
 *
 * @param source - Ref to watch.
 * @param observer - Callback invoked with the new value.
 * @param init - When true, the observer is called immediately with the current
 *   value.
 */
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
