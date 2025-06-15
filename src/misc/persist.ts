import { flatten, ref, watchEffect } from '..'
import { type AnyRef } from '../api/types'
import { onUnmounted } from '../composition/onUnmounted'
import { isDeepRef } from '../reactivity/isDeepRef'
import { ErrorType, getError } from '../log/errors'
import { warning, WarningType } from '../log/warnings'

/**
 * Persists a reactive reference’s value to `localStorage` and keeps it in sync.
 *
 * On initialization, attempts to load and parse an existing value from
 * `localStorage` under the given key. If parsing fails, it will overwrite
 * the stored value with the current ref value. After that, any change to
 * the ref will be serialized (via `JSON.stringify`) and saved to
 * `localStorage` automatically.
 *
 * @template TRef
 * @param {TRef} anyRef - A ref (or deep ref) whose value should be persisted.
 * @param {string} key - The `localStorage` key under which to store the ref’s value.
 * @throws {Error} If `key` is an empty string or not provided.
 * @returns {TRef} The same ref instance, now synchronized with `localStorage`.
 *
 * @example
 * ```ts
 * import { ref, persist } from 'regor'
 * const count = ref(0)
 * persist(count, 'app:count')
 * // count will be initialized from localStorage if present,
 * // and any updates to count ref will be saved automatically.
 * ```
 */
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
