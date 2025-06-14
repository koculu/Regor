---
title: observerCount
---


## Overview

The `observerCount` function allows you to determine the number of observers (callbacks) currently registered on a ref object. This can be useful for debugging and understanding how many entities are actively reacting to changes in the ref object.

## Usage

### Getting the Observer Count

To get the number of observers for a ref object, you can use the `observerCount` function.

```ts
import { observerCount, ref } from 'regor'

const myRef = ref('Hello, Regor!')

// Get the observer count
const count = observerCount(myRef)
console.log('Observer count:', count)
```

## Parameters

- `source`: The ref object for which you want to retrieve the observer count.

## Return Value

- The `observerCount` function returns the number of observers (callbacks) currently registered on the provided ref object.

## Example

```ts
import { observerCount, ref, observe } from 'regor'

const myRef = ref('Hello, Regor!')

// Create an observer for the ref
observe(myRef, () => {
  console.log('Ref value changed.')
})

// Get the observer count
const count = observerCount(myRef)
console.log('Observer count:', count) // Outputs 'Observer count: 1'
```

## See Also

- [`ref`](/api/ref)
- [`observe`](/api/observe)
- [`observeMany`](/api/observeMany)
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

[Back to the API list](/api/regor-api)
