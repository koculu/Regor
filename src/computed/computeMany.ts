import {
  type AnyRef,
  type ComputedRef,
  type StopObserving,
  type UnwrapRef,
} from '../api/types'
import { defineRefValue } from '../common/common'
import { onUnmounted } from '../composition/onUnmounted'
import { ErrorType, getError } from '../log/errors'
import { observe } from '../observer/observe'
import { srefSymbol } from '../reactivity/refSymbols'
import { sref } from '../reactivity/sref'
import { trigger } from '../reactivity/trigger'
import { type ComputedOnce } from './computed'

type SourceValues<TSources extends readonly AnyRef[]> = {
  [TIndex in keyof TSources]: UnwrapRef<TSources[TIndex]>
}

export const computeMany = <
  const TSources extends readonly AnyRef[],
  TReturnType,
>(
  sources: TSources,
  compute: (...values: SourceValues<TSources>) => TReturnType,
): ComputedRef<UnwrapRef<TReturnType>> => {
  const status: ComputedOnce<TReturnType> = {}
  let computer: any
  const result = ((...args: unknown[]) => {
    if (args.length <= 2 && 0 in args)
      throw getError(ErrorType.ComputedIsReadOnly)
    if (computer && !status.isStopped) return computer(...args)
    computer = computeManyOnce<TSources, TReturnType>(sources, compute, status)
    return computer(...args)
  }) as ComputedRef<UnwrapRef<TReturnType>>

  ;(result as any)[srefSymbol] = 1
  defineRefValue(result, true)
  result.stop = () => status.ref?.stop?.()
  onUnmounted(() => result.stop(), true)
  return result
}

const computeManyOnce = <TSources extends readonly AnyRef[], TReturnType>(
  sources: TSources,
  compute: (...values: SourceValues<TSources>) => TReturnType,
  status: ComputedOnce<TReturnType>,
): ComputedRef<UnwrapRef<TReturnType>> => {
  const result =
    status.ref ??
    (sref<TReturnType>(null as TReturnType) as ComputedRef<
      UnwrapRef<TReturnType>
    >)
  status.ref = result
  status.isStopped = false
  let i = 0
  const callback = (_: unknown): void => {
    if (i > 0) {
      result.stop()
      status.isStopped = true
      trigger(result)
      return
    }
    const values = sources.map((source) => source()) as SourceValues<TSources>
    result(compute(...values) as UnwrapRef<TReturnType>)
    ++i
  }
  const stopObservingList: StopObserving[] = []
  for (const item of sources) {
    const stopObserving = observe(item, callback)
    stopObservingList.push(stopObserving)
  }
  callback(null)
  result.stop = () => {
    stopObservingList.forEach((stop) => {
      stop()
    })
  }
  return result
}
