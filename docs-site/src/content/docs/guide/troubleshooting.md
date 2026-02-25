---
title: Troubleshooting
sidebar:
  order: 90
---

Use this page as a symptom -> cause -> fix reference based on current Regor runtime behavior.

## Quick Triage

Before deep debugging:

1. Verify root exists and app actually mounted.
2. Verify template is the one you think is mounted (selector/element/string/json path).
3. Verify binding channel is correct (`:x` vs `:context` vs `r-bind="{...}"`).
4. Verify scope/hook usage (`useScope` for composables).
5. Verify teardown timing (`unmount` + `drainUnbind` in tests).

## App Does Not Mount

Symptom:

1. `createApp` throws and nothing renders.

Likely cause:

1. Missing root element.

Runtime error:

1. `createApp can't find root element...`

Fix:

```ts
createApp(ctx, { element: document.querySelector('#app')! })
// or
createApp(ctx, { selector: '#app' })
```

If you use `createApp(ctx, '<div>...</div>')`, Regor expects a real `#app` in DOM.

## `onMounted` / `onUnmounted` Throws

Symptom:

1. Error about composables requiring scope.

Likely cause:

1. Hook registered outside active scope.

Runtime error:

1. `Use composables in scope. usage: useScope(() => new MyApp())`

Fix:

```ts
createApp(
  useScope(() => {
    onMounted(() => {})
    onUnmounted(() => {})
    return { count: ref(0) }
  }),
  { element: root },
)
```

## Interpolation Not Updating

Symptom:

1. `{{ expr }}` / `[[ expr ]]` appears as raw text.

Likely causes:

1. `config.useInterpolation = false`
2. Markup is under `r-pre`
3. Expression resolves to missing path/value

Fix checklist:

1. Enable interpolation (`RegorConfig.useInterpolation = true`) when needed.
2. Remove `r-pre` from dynamic subtree.
3. Confirm expression resolves in active context.

## Component Inputs Not Reaching Context

Most confusion here comes from input channel mismatch.

Correct routing:

1. `:x` / `.x` / `r-bind:x`:
   works as component prop only when `x` is declared in `props`.
2. `:context` / `r-context`:
   object-style component input channel.
3. `r-bind="{...}"` (object form):
   attribute channel on component hosts (fallthrough), not `head.props` object assignment.

If component sets `head.autoProps = false`, you must map `head.props` manually in `context(head)`.

## Parent-Child Ref Sync Feels Wrong

Check `head.entangle` semantics:

1. `head.entangle = true`:
   ref-to-ref inputs are two-way entangled.
2. `head.entangle = false`:
   ref-to-ref inputs are snapshot-only (no persistent sync).

Also check whether parent sends ref source vs primitive expression:

1. `:context="{ x: someRef }"` behaves differently from `:context="{ x: someRef + 1 }"`.

## Slot Expression Uses Wrong Context

Symptom:

1. Slot content appears to evaluate against child context instead of parent.

Fix:

1. Enable slot context switching in component:

```ts
context: (head) => {
  head.enableSwitch = true
  return {}
}
```

Then verify slot naming matches (`name` / `#name`).

## `r-for` Updates Look Broken

Checklist:

1. Use stable identity keys (`:key="row.id"` or `key="row.id"`).
2. Ensure key is unique and stable across updates.
3. Avoid mutating key identity unexpectedly between renders.

## Cleanup / Memory / Test Flakiness

Know the teardown difference:

1. `app.unmount()` removes root node and queues unbind flush.
2. `app.unbind()` detaches bindings without removing DOM.

In tests, if assertions depend on cleanup side effects:

```ts
app.unmount()
await drainUnbind()
```

## Warnings You Should Not Ignore

Frequent warning types and meaning:

1. Missing binding expression:
   directive attribute exists but expression is empty.
2. Invalid `r-for` expression:
   loop syntax is malformed.
3. Binding requires object expression:
   directive expected object input (for example object-style binding paths).
4. Key is empty:
   dynamic key path resolved to empty key.
5. Model requires ref / unsupported element:
   `r-model` target is invalid for current element/source.

## When Reporting an Issue

Include:

1. Minimal template + context snippet.
2. Expected result vs actual result.
3. Which channel you used (`:x`, `r-bind:x`, `:context`, `r-context`, `r-bind="{...}"`).
4. Whether problem persists after `unmount` + `await drainUnbind()`.
5. Regor version + runtime environment.
