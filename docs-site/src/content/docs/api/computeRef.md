---
title: computeRef
---


## Overview

The `computeRef` function allows you to create a computed ref object that automatically computes its value based on a source ref object and a computation function. This is useful for deriving values from reactive data and ensuring that the computed ref updates whenever the source ref changes.

## Usage

### Creating Computed Refs

To create a computed ref using `computeRef`, you provide a source ref and a computation function. The computation function calculates the computed value based on the value of the source ref, and the computed ref will automatically update when the source ref changes.

```ts
import { computeRef, ref } from 'regor'

const myRef = ref(5)

// Create a computed ref
const computedValue = computeRef(myRef, (value) => value * 2)

console.log(computedValue.value) // Outputs 10

// Later, when myRef changes, computedValue will automatically update
myRef.value = 7
console.log(computedValue.value) // Outputs 14
```

## Parameters

- `source`: The source ref object that the computed ref depends on. Changes to the source ref will trigger the computation.
- `compute`: A function that calculates the computed value based on the current value of the source ref. This function should not have side effects and should only depend on reactive data.

## Return Value

- The `computeRef` function returns a computed ref object that holds the computed value. You can access the computed value using the `.value` property of the computed ref or by invoking it directly.

## Example

```ts
import { computeRef, ref } from 'regor'

const myRef = ref(5)

// Create a computed ref
const computedValue = computeRef(myRef, (value) => value * 2)

console.log(computedValue.value) // Outputs 10

// Later, when myRef changes, computedValue will automatically update
myRef.value = 7
console.log(computedValue.value) // Outputs 14
```

## See Also

- [`ref`](ref.md)
- [`observe`](observe.md)
- [`observeMany`](observeMany.md)
- [`computed`](computed.md)
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
