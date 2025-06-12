---
title: observe
---

# `observe`

## Overview

The `observe` function allows you to create observers that react to changes in ref objects, providing a callback that triggers when the ref's value changes. This is useful for handling side effects or updating UI elements based on reactive data.

[**`Try It Online`**](https://stackblitz.com/edit/regor-sample-ref?file=index.ts)

## Usage

### Creating Observers

To create an observer, you can use the `observe` function, passing in a ref object and a callback function.

```ts
import { observe, ref } from 'regor'

const myRef = ref('Hello, Regor!')

// Create an observer
const stopObserving = observe(myRef, (newValue) => {
  console.log('Value changed:', newValue)
})
```

## Parameters

- `source`: The ref object you want to observe for changes.
- `observer`: A callback function that will be triggered whenever the ref's value changes.
- `init` (optional): If `true`, the observer will be immediately invoked with the current value of the ref when it's created.

## Return Value

- The `observe` function returns a `stopObserving` function that allows you to stop the observer when it's no longer needed. Calling `stopObserving` will unsubscribe the observer from the ref object.

## Example

```ts
import { observe, ref } from 'regor'

const myRef = ref('Hello, Regor!')

// Create an observer with init set to true
const stopObserving = observe(
  myRef,
  (newValue) => {
    console.log('Value changed:', newValue)
  },
  true,
)

// Later, when the observer is no longer needed, stop it
stopObserving()
```

## See Also

- [`observeMany`](observeMany.md)
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
