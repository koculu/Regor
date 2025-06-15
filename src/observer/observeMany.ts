import {
  type AnyRef,
  type ObserveCallback,
  type StopObserving,
} from '../api/types'
import { onUnmounted } from '../composition/onUnmounted'
import { observe } from './observe'

/**
 * Observes multiple refs at once and invokes the given callback when any of
 * them change. The callback receives an array with the current values.
 *
 * @param sources - List of refs to observe.
 * @param observer - Callback called with an array of current values.
 * @param init - When true, the observer is called immediately.
 */
export const observeMany = (
  sources: AnyRef[],
  observer: ObserveCallback<any[]>,
  init?: boolean,
): StopObserving => {
  const stopObservingList: StopObserving[] = []
  const callObserver = (): void => {
    observer(sources.map((y) => y()))
  }
  for (const source of sources) {
    stopObservingList.push(observe(source, callObserver))
  }
  if (init) callObserver()
  const stop = (): void => {
    for (const stopObserving of stopObservingList) {
      stopObserving()
    }
  }
  onUnmounted(stop, true)
  return stop
}
