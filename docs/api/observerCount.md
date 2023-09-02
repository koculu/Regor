# `observerCount`

## Overview

The `observerCount` function is a utility provided by Regor. It allows you to determine the number of observers (callbacks) currently registered on a ref object. This can be useful for debugging and understanding how many entities are actively reacting to changes in the ref object.

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

- [`ref`](ref.md)
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
