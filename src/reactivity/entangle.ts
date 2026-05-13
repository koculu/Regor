import { type AnyRef, type StopObserving } from '../api/types'
import { observe } from '../observer/observe'
import { srefSymbol } from './refSymbols'

const isReadonly = (value: AnyRef): boolean =>
  (value as unknown as Record<symbol, unknown>)[srefSymbol] === 2

export const entangle = (r1: AnyRef, r2: AnyRef): StopObserving => {
  if (r1 === r2) return () => {}
  const r1Readonly = isReadonly(r1)
  const r2Readonly = isReadonly(r2)
  if (r1Readonly && r2Readonly) return () => {}
  if (r1Readonly) {
    const stop = observe(r1, () => r2(r1()))
    r2(r1())
    return stop
  }
  if (r2Readonly) {
    const stop = observe(r2, () => r1(r2()))
    r1(r2())
    return stop
  }
  const stop1 = observe(r1, (v) => r2(v))
  const stop2 = observe(r2, (v) => r1(v))
  r2(r1())
  return () => {
    stop1()
    stop2()
  }
}
