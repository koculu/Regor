import { type AnyRef, type StopObserving } from '../api/types'
import { observe } from '../observer/observe'

export const entangle = (r1: AnyRef, r2: AnyRef): StopObserving => {
  if (r1 === r2) return () => {}
  const stop1 = observe(r1, (v) => r2(v))
  const stop2 = observe(r2, (v) => r1(v))
  r2(r1())
  return () => {
    stop1()
    stop2()
  }
}
