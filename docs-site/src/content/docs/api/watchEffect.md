---
title: watchEffect
---

# `watchEffect`

## Overview

The `watchEffect` function allows you to create an "effect" that automatically reacts to changes in reactive data, such as ref objects or other observables. This effect is useful for handling side effects, such as updating the UI, in a reactive and efficient manner.

## Usage

### Creating Effects

To create an effect using `watchEffect`, you provide a function that defines the effect. This function will be called immediately and then re-called whenever the reactive data it depends on changes.

```ts
import { watchEffect, ref } from 'regor'

const myRef = ref('Hello, Regor!')

// Create a watch effect
const stopWatching = watchEffect(() => {
  console.log('Value:', myRef.value)
})

// Later, when the effect is no longer needed, stop it
stopWatching()
```

## Parameters

- `effect`: A function that defines the effect you want to create. This function may optionally receive a callback function (`onCleanup`) as an argument.

## Return Value

- The `watchEffect` function returns a `stopWatching` function that allows you to stop the effect when it's no longer needed. Calling `stopWatching` will unsubscribe the effect from the reactive data.

## Example

```ts
import { watchEffect, ref } from 'regor'

const myRef = ref('Hello, Regor!')

// Create a watch effect that updates the UI
const stopWatching = watchEffect(() => {
  console.log('Value:', myRef.value)
})

// Later, when the effect is no longer needed, stop it
stopWatching()
```

## See Also

- [`ref`](ref.md)
- [`useScope`](useScope.md)
- [`observe`](observe.md)
- [`observeMany`](observeMany.md)
- [`isDeepRef`](isDeepRef.md)
- [`isRef`](isRef.md)
- [`unref`](unref.md)
- [`sref`](sref.md)
- [`flatten`](flatten.md)
- [`isRaw`](isRaw.md)
- [`markRaw`](markRaw.md)
- [`pause`](pause.md)
- [`resume`](resume.md)
- [`trigger`](trigger.md)

[Back to the API list](regor-api.md)
