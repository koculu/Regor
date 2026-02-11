import { type ComputedRef,type UnwrapRef } from '../api/types'
import { defineRefValue } from '../common/common'
import { onUnmounted } from '../composition/onUnmounted'
import { ErrorType, getError } from '../log/errors'
import { srefSymbol } from '../reactivity/refSymbols'
import { sref } from '../reactivity/sref'
import { trigger } from '../reactivity/trigger'
import { watchEffect } from './watchEffect'

/**
 * @internal
 */
export interface ComputedOnce<TReturnType> {
  isStopped?: boolean
  ref?: ComputedRef<UnwrapRef<TReturnType>>
}

export const computed = <TReturnType>(
  compute: () => TReturnType,
): ComputedRef<UnwrapRef<TReturnType>> => {
  let computer: any
  const status: ComputedOnce<TReturnType> = {}
  const result = ((...args: unknown[]) => {
    if (args.length <= 2 && 0 in args)
      throw getError(ErrorType.ComputedIsReadOnly)
    if (computer && !status.isStopped) return computer(...args)
    computer = computedOnce(compute, status)
    return computer(...args)
  }) as ComputedRef<UnwrapRef<TReturnType>>

  ;(result as any)[srefSymbol] = 1
  defineRefValue(result, true)
  result.stop = () => status.ref?.stop?.()
  onUnmounted(() => result.stop(), true)
  return result
}

const computedOnce = <TReturnType>(
  compute: () => TReturnType,
  status: ComputedOnce<TReturnType>,
): ComputedRef<UnwrapRef<TReturnType>> => {
  const result =
    status.ref ??
    (sref<UnwrapRef<TReturnType>>(null) as ComputedRef<UnwrapRef<TReturnType>>)
  status.ref = result
  status.isStopped = false
  let i = 0
  const stop = watchEffect(() => {
    if (i > 0) {
      stop()
      status.isStopped = true
      trigger(result)
      return
    }
    result(compute() as UnwrapRef<TReturnType>)
    ++i
  })
  result.stop = stop
  return result
}
