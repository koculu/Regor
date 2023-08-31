import {
  type AnyRef,
  type ObserveCallback,
  type StopObserving,
} from '../api/types'
import { onUnmounted } from '../composition/onUnmounted'
import { observe } from './observe'

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
