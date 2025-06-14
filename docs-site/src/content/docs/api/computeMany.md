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

- [`computed`](computed.md)
- [`computeRef`](computeRef.md)
- [`ref`](ref.md)
- [`observe`](observe.md)
- [`observeMany`](observeMany.md)
- [`watchEffect`](watchEffect.md)
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
