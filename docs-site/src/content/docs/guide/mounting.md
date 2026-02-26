---
title: Mounting
sidebar:
  order: 60
---

Regor can mount directly on existing DOM and compose with many rendering/runtime strategies.

One common pattern is static-first pages with dynamic islands, but Regor is not limited to that model.

1. Render most page content as static HTML (SSG/SSR/build-time output).
2. Mount Regor only where runtime behavior is needed.
3. Keep static and dynamic ownership intentionally separated.

In many projects, this can mean mostly static content with selectively mounted dynamic regions.

## Why this is powerful

This architecture gives you:

1. Fast first paint from static HTML.
2. Minimal runtime cost by mounting only where needed.
3. Better control over complexity and ownership boundaries.
4. Freedom to run multiple independent Regor apps on one page.

## Typical dynamic islands

Examples where selective mounting is ideal:

1. Auth/login area in top navigation.
2. Profile badge/menu/avatar state.
3. Cart counters and checkout widgets.
4. Search/filter controls.
5. Realtime status chips, notifications, dashboards.

## Multi-mount pattern

You can mount separate Regor contexts into multiple existing DOM roots:

```html
<header>
  <div id="auth-island">
    <button r-if="!user">Login</button>
    <img r-else :src="user.avatar" :title="user.name" />
  </div>
</header>

<aside>
  <div id="notif-island">
    <span r-text="count"></span>
  </div>
</aside>
```

```ts
import { createApp, ref, sref } from 'regor'

const user = sref<{ name: string; avatar: string } | null>(null)
const count = ref(0)

createApp({ user }, { element: document.querySelector('#auth-island')! })

createApp({ count }, { element: document.querySelector('#notif-island')! })
```

This is first-class Regor usage.

## Runtime ownership options

When mixing runtimes and rendering layers:

1. Static renderer owns static regions.
2. Regor owns only mounted island roots.
3. Multiple runtimes can coexist, including on nearby/overlapping areas, but behavior is easiest to reason about when ownership boundaries are explicit.
4. Use clear root boundaries per island where possible for predictability.

## Mount modes on existing DOM

`createApp` supports:

1. In-place binding of existing subtree (`{ element }` or `{ selector }` without `template`/`json`).
2. Replacing root children when `template` or `json` is provided.

Use in-place mode whenever markup is already present and you only need reactive behavior.

## Architectural guidance

1. Prefer many small island roots over one giant runtime root.
2. Keep high-churn UI in isolated islands.
3. Keep long-form/static content fully static.
4. Unmount islands explicitly when their host is removed.

## See Also

1. [Guide: Components](/guide/components)
2. [Guide: Lifecycle and Cleanup](/guide/lifecycle-and-cleanup)
3. [Performance Guide](/guide/performance)
