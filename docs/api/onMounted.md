# `onMounted`

## Overview

The `onMounted` function allows you to register a callback function that will be executed when an app or component is mounted or initialized. This is particularly useful for performing setup tasks or side effects when a component becomes active.

## Usage

### Registering the `onMounted` Callback

To register an `onMounted` callback, simply call the `onMounted` function and pass the desired callback function as an argument. The callback will be executed when the app or component is mounted.

```ts
import { createApp, html, useScope, onMounted } from 'regor'

const userRow = createComponent(() => ({
    // Register an onMounted callback
    onMounted(() => {
      // Perform initialization tasks
      console.log('Component is mounted!')
    })
}), {
  html: html`<div></div>`,
})

createApp(
  useScope(() => {
    // Register an onMounted callback
    onMounted(() => {
      // Perform initialization tasks
      console.log('App is mounted!')
    })
    return {}
  }),
)
```

## Parameters

- `onMounted` (required): A callback function that will be executed when the component or scope is mounted.

## Notes

- `onMounted` callbacks can be useful for initializing state, fetching data, setting up event listeners, or any other task that should be performed when a component becomes active.

- Multiple `onMounted` callbacks can be registered, and they will be executed in the order they were registered.

- `onMounted` is often used in conjunction with `onUnmounted` to define cleanup tasks that should be performed when a component is unmounted.

## See Also

- [`useScope`](useScope.md)
- [`onUnmounted`](onUnmounted.md)

[Back to the API list](regor-api.md)
