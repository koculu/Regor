import { flatten, ref, watchEffect } from '..'
import { type AnyRef } from '../api/types'
import { onUnmounted } from '../composition/onUnmounted'
import { isDeepRef } from '../reactivity/isDeepRef'
import { ErrorType, getError } from '../log/errors'
import { warning, WarningType } from '../log/warnings'

export const persist = <TRef extends AnyRef>(
  anyRef: TRef,
  key: string,
): TRef => {
  if (!key) throw getError(ErrorType.PersistRequiresKey)
  const deepRef = isDeepRef(anyRef)
  const makeRef = deepRef ? ref : (x: any) => x
  const store = (): void =>
    localStorage.setItem(key, JSON.stringify(flatten(anyRef())))
  const existing = localStorage.getItem(key)
  if (existing != null) {
    try {
      anyRef(makeRef(JSON.parse(existing)))
    } catch (e) {
      warning(
        WarningType.ErrorLog,
        `persist: failed to parse data for key ${key}`,
        e as Error,
      )
      store()
    }
  } else {
    store()
  }
  const stopObserving = watchEffect(store)
  onUnmounted(stopObserving, true)
  return anyRef
}
