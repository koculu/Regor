---
title: Reactivity
sidebar:
  order: 10
---

This page describes Regor reactivity based on actual runtime behavior.

## Core model

1. A ref is a callable value container (`r()`, `r(newValue)`) with `.value` alias.
2. `ref()` and `sref()` are both refs (`isRef(...) === true`).
3. `ref()` is deep-conversion oriented.
4. `sref()` is shallow-conversion oriented.

## `ref` vs `sref` (important)

### `ref(value)`

`ref` recursively converts nested object/array properties to refs.

```ts
const user = ref({ name: 'Ada', meta: { active: true } })
user().name('Grace')
user().meta().active(false)
```

Key behavior:

1. Object/array content is converted recursively.
2. Source objects are mutated in place during conversion.
3. Existing refs are reused.
4. `Node`, `Date`, `RegExp`, `Promise`, `Error` are not recursively converted.

### `sref(value)`

`sref` keeps nested properties as plain values (no recursive wrapping).

```ts
const user = sref({ name: 'Ada', age: 30 })
user().name = 'Grace'
user().age = 31
```

Key behavior:

1. Nested values stay plain unless they were already refs.
2. Arrays/Map/Set are made reactive via prototype adaptation.
3. `sref(sourceRef)` returns the same ref instance.

## Access and update forms

For both `ref` and `sref`:

```ts
const r = ref(1)
r() // get
r(2) // set
r.value // get
r.value = 3 // set
```

## Derived refs: `computed`, `computeRef`, `computeMany`

Regor computed refs are:

1. Read-only.
2. Lazy (first evaluation happens on first read).
3. Cached until dependencies change.
4. Invalidated on source change, then recomputed on next read.

```ts
const a = ref(1)
const b = ref(2)
const sum = computeMany([a, b], (x, y) => x + y)

sum() // 3 (computes now)
sum() // 3 (cached)
a(5)
sum() // 7 (recomputed after invalidation)
```

## `watchEffect`

`watchEffect` immediately runs and tracks refs accessed during execution.

When any tracked ref changes:

1. Cleanup callbacks registered through `onCleanup` are called.
2. Effect is re-subscribed using newly accessed refs.

```ts
const count = ref(0)
const stop = watchEffect((onCleanup) => {
  const snapshot = count()
  onCleanup?.(() => console.log('cleanup', snapshot))
  console.log('value', snapshot)
})
```

Use `silence(() => ...)` to read refs without tracking.

## `observe` and `observeMany`

`observe(source, cb, init?)` listens to one ref.
`observeMany([a, b], cb, init?)` listens to multiple refs and returns tuple values.

Both return a stop function.

## Batch and manual trigger

`batch`/`startBatch`/`endBatch` defer observer notification until batch end.

```ts
batch(() => {
  a(1)
  a(2)
  b(3)
})
```

Observers are triggered once per changed ref after batch completion.

Use `trigger(ref)` to manually notify observers.

`trigger(ref, undefined, true)` recursively triggers nested refs.

## Pause and resume

`pause(ref)` disables auto observer firing for that ref.
`resume(ref)` re-enables it.
Manual `trigger(ref)` still works while paused.

## Other important helpers

1. `unref(x)` unwraps one ref level.
2. `isRef(x)` checks any ref (`ref` or `sref`).
3. `isDeepRef(x)` checks whether value was created as deep `ref`.
4. `entangle(a, b)` creates two-way sync and initializes `b` with `a`.
5. `persist(ref, key)` syncs ref data with `localStorage`.

## Collections and caveats

1. `Map` and `Set` are reactive through Regor’s proxy prototypes.
2. `WeakMap` and `WeakSet` are not auto-reactive; use `trigger(...)` manually when needed.
3. For very large nested structures, pick `ref` vs `sref` intentionally based on update style and cost.

## See Also

1. [API Reference](../api)
2. [Lifecycle and Cleanup](./lifecycle-and-cleanup)
3. [Templates and Expressions](./templates)
