# `observeMany`

## Overview

The `observeMany` function allows you to create observers that react to changes in multiple ref objects simultaneously. This is useful for handling side effects or updating UI elements based on changes in multiple reactive data sources.

## Usage

### Creating Observers for Multiple Refs

To create an observer for multiple ref objects, you can use the `observeMany` function, passing in an array of ref objects and a callback function.

```ts
import { observeMany, ref } from 'regor'

const ref1 = ref('Hello')
const ref2 = ref('World')

// Create an observer for multiple refs
const stopObserving = observeMany([ref1, ref2], (newValues) => {
  console.log('Values changed:', newValues)
})
```

## Parameters

- `sources`: An array of ref objects you want to observe for changes.
- `observer`: A callback function that will be triggered whenever any of the ref values change. The callback receives an array of the current values of all observed refs.
- `init` (optional): If `true`, the observer will be immediately invoked with the current values of the refs when it's created.

## Return Value

- The `observeMany` function returns a `stopObserving` function that allows you to stop the observer when it's no longer needed. Calling `stopObserving` will unsubscribe the observer from all the observed ref objects.

## Example

```ts
import { observeMany, ref } from 'regor'

const ref1 = ref('Hello')
const ref2 = ref('World')

// Create an observer for multiple refs with init set to true
const stopObserving = observeMany(
  [ref1, ref2],
  (newValues) => {
    console.log('Values changed:', newValues)
  },
  true,
)

// Later, when the observer is no longer needed, stop it
stopObserving()
```

## See Also

- [`observe`](observe.md)
- [`observerCount`](observerCount.md)
- [`watchEffect`](watchEffect.md)
- [`computed`](computed.md)
- [`ref`](ref.md)
- [`sref`](sref.md)
- [`flatten`](flatten.md)
- [`pause`](pause.md)
- [`resume`](resume.md)
- [`trigger`](trigger.md)

[Back to the API list](regor-api.md)
