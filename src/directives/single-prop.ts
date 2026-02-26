import { type AnyRef, type Directive, type Unbinder } from '../api/types'
import { camelize } from '../common/common'
import { entangle } from '../reactivity/entangle'
import { isRef } from '../reactivity/isRef'
import { ref } from '../reactivity/ref'

/**
 * Bridge strategy for `:prop="someRefPath"` bindings
 *
 * Problem this solves:
 * - If a component prop is directly entangled to a source ref, retargeting
 *   (e.g. switching selected item refs) can mutate previous sources.
 * - Nested component forwarding (`:model="model"`) still needs two-way sync.
 *
 * How this works:
 * 1) First non-bridge ref source creates a stable bridge ref.
 *    - `ctx[key]` is pointed to this bridge.
 *    - Source `<->` bridge are entangled.
 * 2) On source ref identity changes, we re-entangle new source `<->` same bridge.
 *    - Consumers stay connected to the stable bridge.
 * 3) If incoming value is already a bridge (forwarded from parent), do not create
 *    another bridge. Forward via entangle/assignment only.
 * 4) For non-ref values:
 *    - If currently using the bridge, write into bridge (`bridge(value)`) so
 *      linked refs receive updates.
 *    - Otherwise assign/update target directly.
 *
 * Why bridge creation is only at first non-bridge boundary:
 * - Prevents stacking bridges at every forwarding level.
 * - Preserves nested propagation while avoiding previous-source overwrite.
 */
const modelBridgeSymbol = Symbol('modelBridge')
const noop: Unbinder = () => {}
const isModelBridge = (value: unknown): boolean =>
  !!(value as Record<symbol, unknown>)?.[modelBridgeSymbol]
const markModelBridge = (value: AnyRef): void => {
  ;(value as unknown as Record<symbol, unknown>)[modelBridgeSymbol] = 1
}
const createModelBridge = (source: AnyRef): AnyRef => {
  const bridge = ref(source()) as unknown as AnyRef
  markModelBridge(bridge)
  return bridge
}

/**
 * @internal
 */
export const singlePropDirective: Directive = {
  collectRefObj: true,
  mount: ({ parseResult, option }) => {
    if (typeof option !== 'string' || !option) return noop
    const key = camelize(option)
    let currentSource: AnyRef | undefined
    let bridge: AnyRef | undefined
    let stopEntangle: Unbinder = noop

    const resetSync = (): void => {
      stopEntangle()
      stopEntangle = noop
      currentSource = undefined
      bridge = undefined
    }
    const clearEntangle = (): void => {
      stopEntangle()
      stopEntangle = noop
    }
    const syncRefs = (source: AnyRef, target: AnyRef): void => {
      if (currentSource === source) return
      clearEntangle()
      stopEntangle = entangle(source, target)
      currentSource = source
    }

    const apply = (): void => {
      const value = parseResult.refs[0] ?? parseResult.value()[0]
      const ctx = parseResult.context
      const ctxKey = ctx[key]

      if (!isRef(value)) {
        if (bridge && ctxKey === bridge) {
          bridge(value)
          return
        }
        resetSync()
        if (isRef(ctxKey)) {
          ctxKey(value)
          return
        }
        ctx[key] = value
        return
      }

      if (isModelBridge(value)) {
        if (ctxKey === value) return
        if (isRef(ctxKey)) {
          syncRefs(value, ctxKey)
        } else {
          ctx[key] = value
        }
        return
      }

      if (!bridge) bridge = createModelBridge(value)
      ctx[key] = bridge

      syncRefs(value, bridge)
    }
    return {
      update: () => {
        apply()
      },
      unmount: () => {
        stopEntangle()
      },
    }
  },
}
