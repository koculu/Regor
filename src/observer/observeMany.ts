import { type AnyRef, type StopObserving, type UnwrapRef } from '../api/types'
import { onUnmounted } from '../composition/onUnmounted'
import { observe } from './observe'

type ObserveManySourceValues<TSources extends readonly AnyRef[]> = {
  [TIndex in keyof TSources]: UnwrapRef<TSources[TIndex]>
}

export const observeMany = <const TSources extends readonly AnyRef[]>(
  sources: TSources,
  observer: (values: ObserveManySourceValues<TSources>) => void,
  init?: boolean,
): StopObserving => {
  const stopObservingList: StopObserving[] = []
  const callObserver = (): void => {
    observer(
      sources.map((source) => source()) as ObserveManySourceValues<TSources>,
    )
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
