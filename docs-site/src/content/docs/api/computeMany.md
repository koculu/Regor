---
title: computeMany
---

## Overview

The `computeMany` function allows you to create a computed ref object that depends on multiple source ref objects and a computation function. The computed ref automatically updates when any of the source refs change, making it useful for deriving values from multiple reactive data sources.

## Usage

### Creating Computed Refs

To create a computed ref using `computeMany`, you provide an array of source ref objects and a computation function. The computation function calculates the computed value based on the values of the source refs, and the computed ref will automatically update when any of the source refs change.

```ts
import { computeMany, ref } from 'regor'

const myRef1 = ref(5)
const myRef2 = ref(10)

// Create a computed ref that depends on both myRef1 and myRef2
const computedValue = computeMany(
  [myRef1, myRef2],
  (value1, value2) => value1 + value2,
)

console.log(computedValue.value) // Outputs 15

// Later, when myRef1 or myRef2 changes, computedValue will automatically update
myRef1.value = 7
console.log(computedValue.value) // Outputs 17
```

## Parameters

- `sources`: An array of source ref objects that the computed ref depends on. Changes to any of the source refs will trigger the computation.
- `compute`: A function that calculates the computed value based on the values of the source refs. This function should not have side effects and should only depend on reactive data.

## Return Value

- The `computeMany` function returns a computed ref object that holds the computed value. You can access the computed value using the `.value` property of the computed ref or by invoking it directly.

## Example

```ts
import { computeMany, ref } from 'regor'

const myRef1 = ref(5)
const myRef2 = ref(10)

// Create a computed ref that depends on both myRef1 and myRef2
const computedValue = computeMany(
  [myRef1, myRef2],
  (value1, value2) => value1 + value2,
)

console.log(computedValue.value) // Outputs 15

// Later, when myRef1 or myRef2 changes, computedValue will automatically update
myRef1.value = 7
console.log(computedValue.value) // Outputs 17
```

## See Also

- [`computed`](/api/computed)
- [`computeRef`](/api/computeRef)
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
