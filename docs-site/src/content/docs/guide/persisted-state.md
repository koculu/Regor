---
title: Persisted State
sidebar:
  order: 70
---

`persist(...)` is one of Regor’s highest-leverage features:

1. Turn any ref into persistent state with one call.
2. It returns the same ref instance, so it can be used inline in context creation.
3. State is restored from `localStorage` on startup.

## Why it matters

For static-first sites with dynamic islands, `persist` lets each island keep user state without extra storage wiring.

Typical persisted states:

1. Auth/session display model.
2. Profile UI preferences.
3. Theme, locale, and layout options.
4. Last-opened tabs, filters, and panel state.

## Real-world sample: header + preferences

```ts
import { createApp, persist, ref, sref } from 'regor'

createApp(
  {
    // Persisted auth/profile island state
    auth: persist(
      sref({
        loggedIn: false,
        name: '',
        avatar: '',
      }),
      'app:auth',
    ),

    // Persisted UI preferences
    prefs: persist(
      sref({
        theme: 'dark',
        locale: 'en',
        compact: false,
      }),
      'app:prefs',
    ),

    // Persisted primitive ref
    notifCount: persist(ref(0), 'app:notif-count'),
  },
  {
    element: document.querySelector('#topbar-island')!,
  },
)
```

```html
<header>
  <button r-if="!auth.loggedIn">Login</button>
  <div r-else>
    <img :src="auth.avatar" :title="auth.name" />
    <span r-text="auth.name"></span>
  </div>

  <select r-model="prefs.theme">
    <option value="dark">Dark</option>
    <option value="light">Light</option>
  </select>

  <button @click="notifCount = notifCount + 1">
    Notifications: <span r-text="notifCount"></span>
  </button>
</header>
```

After reload, previous values are restored automatically.

## Inline context creation pattern

Because `persist` returns the same ref, this is valid and recommended:

```ts
const context = {
  theme: persist(ref('dark'), 'app:theme'),
  filters: persist(sref({ status: 'open', query: '' }), 'app:filters'),
}
```

## Behavior details

1. If stored JSON exists, ref is hydrated from storage.
2. If stored JSON is invalid, Regor logs warning and rewrites storage with current ref value.
3. If key is empty, `persist` throws.
4. Updates are synced via reactive observation.

## Key strategy

Use namespaced keys:

1. `app:auth`
2. `app:prefs`
3. `page:search:filters`

Avoid collisions across islands/features.

## See Also

1. [API: persist](/api/persist)
2. [Guide: Mounting](/guide/mounting)
3. [Guide: Reactivity](/guide/reactivity)
