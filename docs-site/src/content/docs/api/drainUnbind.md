---
title: drainUnbind
---

## Overview

`drainUnbind` flushes Regor's pending unbind queue immediately.

Regor defers some unbind work after `removeNode(...)` for better runtime behavior. Use `drainUnbind()` when you need deterministic cleanup timing.

## Usage

```ts
import { createApp, drainUnbind, html, ref } from 'regor'

const root = document.createElement('div')
const show = ref(true)

const app = createApp({
  template: html`<div><span r-if="show">Hello</span></div>`,
  setup: { show },
})

app.mount(root)
show(false) // schedules node removal + deferred unbind

await drainUnbind() // force pending unbind cleanup now
```

## Signature

```ts
drainUnbind(): Promise<void>
```

## Notes

- Safe to call when there is nothing pending.
- Useful in tests when you need cleanup completed before assertions.
- Complements `removeNode` and `unbind`; it does not replace app lifecycle (`app.unmount()`).

## See Also

- [removeNode](/api/removeNode)
- [unbind](/api/unbind)
- [addUnbinder](/api/addUnbinder)

[Back to the API list](/api/)
