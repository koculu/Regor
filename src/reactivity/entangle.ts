import { type AnyRef, type StopObserving } from '../api/types'
import { observe } from '../observer/observe'

/**
 * Creates a bidirectional link between two refs so that changes to one are
 * automatically propagated to the other. Returns a function that breaks the
 * link.
 *
 * @param r1 - First ref.
 * @param r2 - Second ref.
 */
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
