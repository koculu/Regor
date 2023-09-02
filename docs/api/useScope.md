# `useScope`

## Overview

The `useScope` function allows you to create a scope for an app or composable, enabling you to manage initialization and cleanup tasks specific to that scope. Scopes are useful for organizing and encapsulating logic within your components.

Components are always created in scope using `createComponent` function.

## Usage

### Creating a Scope

To create a scope for an app or composable, call the `useScope` function and pass a context function as its argument. The context function is used to set up the scope's context and register initialization and cleanup tasks.

```ts

import { createApp, html, useScope, onUnmounted, ref, computed, watchEffect } from 'regor'

const userRow = createComponent(() => ({
    // Register an onUnmounted callback
    onUnmounted(() => {
      // Perform cleanup  tasks
      console.log('Component is unmounted!')
    })
}), {
  html: html`<div></div>`,
})

createApp(
  useScope(() => {
    // Register an onUnmounted callback
    onUnmounted(() => {
      // Perform cleanup  tasks
      console.log('App is unmounted!')
    })
    return {}
  }),
)

const ref1 = ref(5)
const scope = useScope(() => {
    watchEffect(() => {
        // do some reactive tasks
    })
    const computedValue = computed(() => ref1() * 2)
    return { computedValue }
  })

scope.unmount() // Registered observers by watchEffect and computed are cleaned up
```

### Cleanup and Unmounting

Scopes are especially useful for defining cleanup behavior when a component is unmounted. You can register `onUnmounted` callbacks within the scope to handle cleanup tasks.

## Parameters

- `context` (required): A function that sets up the context and registers initialization and cleanup tasks for the scope.

## Return Value

- An object containing the following properties:
  - `context`: The context of the scope that can be used within the component or composable.
  - `unmount`: A function that, when called, triggers the cleanup tasks registered within the scope. It is automatically being called when the app or component is unmounted. It can be manually caled for custom scopes.

## Notes

- Scopes help you encapsulate and organize component-specific logic, making it easier to manage initialization and cleanup tasks.

- Multiple scopes can be created within a single component or composable to isolate different sets of tasks.

## See Also

- [`onMounted`](onMounted.md)
- [`onUnmounted`](onUnmounted.md)

[Back to the API list](regor-api.md)
