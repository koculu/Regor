---
title: Lifecycle and Cleanup
sidebar:
  order: 50
---

This page describes Regor lifecycle and teardown behavior from the actual runtime flow.

## Runtime lifecycle order

`createApp(...)` runs in this order:

1. Resolve root (`element`, `selector`, or default `#app` for string template shortcut).
2. If `template`/`json` is provided, replace root content first.
3. Run interpolation (when enabled in config).
4. Bind directives/components.
5. Register root cleanup callback.
6. Call mounted lifecycle (`onMounted(...)` callbacks and optional `context.mounted()` method).

## Hook registration with `useScope`

`onMounted` / `onUnmounted` are scope-based APIs.
In practice, register them while creating context inside `useScope(...)`:

```ts
import { createApp, html, onMounted, onUnmounted, ref, useScope } from 'regor'

class AppCtx {
  count = ref(0)
  logs: string[] = []

  constructor() {
    onMounted(() => this.logs.push('mounted'))
    onUnmounted(() => this.logs.push('unmounted'))
  }
}

const app = createApp(
  useScope(() => new AppCtx()),
  {
    element: document.querySelector('#app')!,
    template: html`<p r-text="count"></p>`,
  },
)
```

Calling these hooks outside an active scope throws (`ComposablesRequireScope`).

## `unmount()` vs `unbind()`

Returned app exposes both:

1. `app.unmount()`
   - Removes root node from DOM (`removeNode(root)`).
   - Unbind runs through deferred queue.
2. `app.unbind()`
   - Unbinds root subtree immediately.
   - Keeps DOM in place.

Use `unmount()` when app is gone.
Use `unbind()` when markup stays but Regor behavior must stop.

## Deferred cleanup queue and `drainUnbind()`

`removeNode(...)` queues unbind work and flushes it with a short timer.
This keeps removal fast, but cleanup side effects are not always immediate in the same tick.

`drainUnbind()` forces pending queue flush now.

Typical test teardown:

```ts
import { createApp, drainUnbind, html, ref } from 'regor'

const root = document.createElement('div')
const app = createApp(
  { n: ref(1) },
  { element: root, template: html`<p r-text="n"></p>` },
)

app.unmount()
await drainUnbind()
```

## Component lifecycle notes

Component teardown is registered through unbinders on component markers/host nodes.
When component subtree is unbound:

1. `onUnmounted(...)` callbacks run for component context.
2. `context.unmounted?.()` runs if defined.
3. Directive observers/listeners are detached.
4. Slot-switch helper contexts are released.

## `ComponentHead.unmount()`

Inside component context, `head.unmount()` is a force-remove tool:

1. Removes nodes between component start/end markers.
2. Calls unmounted lifecycle for captured component contexts.

Use only when component wants to self-remove its rendered block.

## Practical cleanup patterns

1. Page-level app:
   Prefer `app.unmount()` on route/page disposal.
2. Keep DOM, disable behavior:
   Use `app.unbind()`.
3. Test suites:
   `app.unmount()` + `await drainUnbind()` in `finally`.
4. Manual reactive resources:
   If you create observers/effects outside scoped/component lifecycle, stop them explicitly.

## See Also

1. [API: createApp](/api/createApp)
2. [API: useScope](/api/useScope)
3. [API: onMounted](/api/onMounted)
4. [API: onUnmounted](/api/onUnmounted)
5. [API: removeNode](/api/removeNode)
6. [API: drainUnbind](/api/drainUnbind)
7. [API: unbind](/api/unbind)
