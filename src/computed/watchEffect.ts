import { type AnyRef, type OnCleanup, type StopObserving } from '../api/types'
import { onUnmounted } from '../composition/onUnmounted'
import { observe } from '../observer/observe'

const collectedRefs: Array<Set<AnyRef> | null> = []

/**
 * @internal
 */
export const collectRef = (ref: AnyRef): void => {
  if (collectedRefs.length === 0) return
  collectedRefs[collectedRefs.length - 1]?.add(ref)
}

/**
 * @internal
 */
interface Terminator {
  stop: StopObserving
}

export const watchEffect = (
  effect: (onCleanup?: OnCleanup) => void,
): StopObserving => {
  if (!effect) return () => {}
  const terminator: Terminator = { stop: () => {} }
  watchEffectInternal(effect, terminator)
  onUnmounted(() => terminator.stop(), true)
  return terminator.stop
}

const watchEffectInternal = (
  effect: (onCleanup?: OnCleanup) => void,
  terminator: Terminator,
): void => {
  if (!effect) return
  let stopObservingList: StopObserving[] = []
  let isStopped = false

  const stopWatch = (): void => {
    for (const stop of stopObservingList) stop()
    stopObservingList = []
    isStopped = true
  }
  terminator.stop = stopWatch
  try {
    const set = new Set<AnyRef>()
    collectedRefs.push(set)
    effect((onCleanup) => stopObservingList.push(onCleanup))
    if (isStopped) return
    for (const r of [...set]) {
      const stopObserving = observe(r, () => {
        stopWatch()
        watchEffect(effect)
      })
      stopObservingList.push(stopObserving)
    }
  } finally {
    collectedRefs.pop()
  }
}

export const silence = <TReturnType>(
  action: () => TReturnType,
): TReturnType => {
  const len = collectedRefs.length
  const hasPush = len > 0 && collectedRefs[len - 1]
  try {
    if (hasPush) collectedRefs.push(null)
    return action()
  } finally {
    if (hasPush) collectedRefs.pop()
  }
}

export const collectRefs = <TReturnType>(
  action: () => TReturnType,
): { value: TReturnType; refs: AnyRef[] } => {
  try {
    const set = new Set<AnyRef>()
    collectedRefs.push(set)
    const result = action()
    return { value: result, refs: [...set] }
  } finally {
    collectedRefs.pop()
  }
}
