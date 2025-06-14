---
title: entangle
---


## Overview

The `entangle` function allows you to create a bidirectional link between two refs, ensuring that changes in one ref are mirrored in the other. This bidirectional linking is particularly useful when you want two refs to always have the same value.

## Usage

### Creating a Bidirectional Link

To create a bidirectional link between two refs, simply call the `entangle` function with the two refs as arguments. After calling `entangle`, any changes made to one ref will be automatically reflected in the other.

```ts
import { entangle, ref } from 'regor'

const ref1 = ref(5)
const ref2 = ref(10)

const stopEntangle = entangle(ref1, ref2)

console.log(ref1.value) // Outputs: 5
console.log(ref2.value) // Outputs: 5

ref1.value = 15 // Both refs are updated
console.log(ref1.value) // Outputs: 15
console.log(ref2.value) // Outputs: 15

stopEntangle() // Stop the bidirectional linking
```

## Parameters

- `r1`: The first ref that you want to entangle.
- `r2`: The second ref that you want to entangle.

## Return Value

- The `entangle` function returns a function that, when called, stops the bidirectional linking between the two refs.

## Notes

- Changes made to either of the entangled refs will be automatically reflected in the other, ensuring that they always have the same value.

- It's important to call the returned function to stop the bidirectional linking when you no longer need it to prevent unintended updates.

- Circular entanglements, where ref1 and ref2 form a circular dependency, should be avoided, as they can lead to infinite loops and unpredictable behavior.

## Example

```ts
import { entangle, ref } from 'regor'

const ref1 = ref(5)
const ref2 = ref(10)

const stopEntangle = entangle(ref1, ref2)

console.log(ref1.value) // Outputs: 5
console.log(ref2.value) // Outputs: 5

ref1.value = 15 // Both refs are updated
console.log(ref1.value) // Outputs: 15
console.log(ref2.value) // Outputs: 15

stopEntangle() // Stop the bidirectional linking
```

## See Also

- [`ref`](ref.md)
- [`sref`](ref.md)
- [`observe`](observe.md)
- [`observeMany`](observeMany.md)
- [`unref`](unref.md)
- [`isRef`](isRef.md)
- [`isDeepRef`](isDeepRef.md)
- [`computeRef`](computeRef.md)
- [`watchEffect`](watchEffect.md)

[Back to the API list](regor-api.md)
