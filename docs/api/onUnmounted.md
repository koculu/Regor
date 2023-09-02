# `onUnmounted`

## Overview

The `onUnmounted` function allows you to register a callback function that will be executed when a component or scope is unmounted or cleaned up. This is useful for performing cleanup tasks or removing event listeners when a component becomes inactive.

## Usage

### Registering the `onUnmounted` Callback

To register an `onUnmounted` callback, simply call the `onUnmounted` function and pass the desired callback function as an argument. The callback will be executed when the component or scope is unmounted or cleaned up.

```ts
import { createApp, html, useScope, onUnmounted } from 'regor'

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
      // Perform cleanup tasks
      console.log('App is unmounted!')
    })
    return {}
  }),
)
```

## Parameters

- `onUnmounted` (required): A callback function that will be executed when the app or component is unmounted or cleaned up.

## Notes

- `onUnmounted` callbacks can be useful for cleaning up resources, removing event listeners, or any other task that should be performed when a component becomes inactive.

- Multiple `onUnmounted` callbacks can be registered, and they will be executed in the order they were registered.

- `onUnmounted` is often used in conjunction with `onMounted` to define initialization and cleanup tasks for components or scopes.

## See Also

- [`useScope`](useScope.md)
- [`onMounted`](onMounted.md)

[Back to the API list](regor-api.md)
