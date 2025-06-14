---
title: computed
---

## Overview

The `computed` function allows you to create a computed property that depends on reactive data and automatically updates when its dependencies change. Computed properties are useful for performing complex calculations or transformations on reactive data.

[**`Try It Online`**](https://stackblitz.com/edit/regor-sample-ref?file=index.ts)

## Usage

### Creating Computed Properties

To create a computed property using `computed`, you provide a function (`compute`) that calculates the computed value based on reactive data. The computed property will automatically update whenever the reactive data it depends on changes.

```ts
import { computed, ref } from 'regor'

const myRef = ref(5)

// Create a computed property
const computedValue = computed(() => myRef.value * 2)

console.log(computedValue.value) // Outputs 10

// Later, when myRef changes, computedValue will automatically update
myRef.value = 7
console.log(computedValue.value) // Outputs 14
```

## Parameters

- `compute`: A function that calculates the computed value based on reactive data. This function should not have any side effects and should only depend on reactive data.

## Return Value

- The `computed` function returns a computed ref object that holds the calculated value. You can access the computed value using the `.value` property of the computed ref or by invoking it directly.

## Example

```ts
import { computed, ref } from 'regor'

const myRef = ref(5)

// Create a computed property
const computedValue = computed(() => myRef.value * 2)

console.log(computedValue.value) // Outputs 10

// Later, when myRef changes, computedValue will automatically update
myRef.value = 7
console.log(computedValue.value) // Outputs 14
```

## See Also

- [`ref`](/api/ref)
- [`observe`](/api/observe)
- [`observeMany`](/api/observeMany)
- [`watchEffect`](/api/watchEffect)
- [`isDeepRef`](/api/isDeepRef)
- [`isRef`](/api/isRef)
- [`unref`](/api/unref)
- [`sref`](/api/sref)
- [`flatten`](/api/flatten)
- [`isRaw`](/api/isRaw)
- [`markRaw`](/api/markRaw)
- [`pause`](/api/pause)
- [`resume`](/api/resume)
- [`trigger`](/api/trigger)

[Back to the API list](/api/)
