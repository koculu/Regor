import { observe } from '../observer/observe'
import { type AnyRef, type ComputedRef, type UnwrapRef } from '../api/types'
import { sref } from '../reactivity/sref'
import { defineRefValue } from '../common/common'
import { ErrorType, getError } from '../log/errors'
import { type ComputedOnce } from './computed'
import { trigger } from '../reactivity/trigger'
import { srefSymbol } from '../reactivity/refSymbols'
import { onUnmounted } from '../composition/onUnmounted'

/**
 * Creates a computed ref based on a single source ref. The `compute` callback
 * is invoked with the source's value and the result is cached until the source
 * changes.
 *
 * @param source - Source ref to observe.
 * @param compute - Function that derives the computed value from the source.
 */
export const computeRef = <TValueType extends AnyRef, TReturnType>(
  source: TValueType,
  compute: (value: UnwrapRef<TValueType>) => TReturnType,
): ComputedRef<UnwrapRef<TReturnType>> => {
  const status: ComputedOnce<TReturnType> = {}
  let computer: any
  const result = ((...args: unknown[]) => {
    if (args.length <= 2 && 0 in args)
      throw getError(ErrorType.ComputedIsReadOnly)
    if (computer && !status.isStopped) return computer(...args)
    computer = computeRefOnce(source, compute, status)
    return computer(...args)
  }) as ComputedRef<UnwrapRef<TReturnType>>

  ;(result as any)[srefSymbol] = 1
  defineRefValue(result, true)
  result.stop = () => status.ref?.stop?.()
  onUnmounted(() => result.stop(), true)
  return result
}

const computeRefOnce = <TValueType extends AnyRef, TReturnType>(
  source: TValueType,
  compute: (value: UnwrapRef<TValueType>) => TReturnType,
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
  result.stop = observe(
    source,
    (refValue) => {
      if (i > 0) {
        result.stop()
        status.isStopped = true
        trigger(result)
        return
      }
      result(compute(refValue) as UnwrapRef<TReturnType>)
      ++i
    },
    true,
  )
  return result
}
