---
title: unref
---

## Overview

The `unref` function allows you to safely retrieve the original value from a ref object if the given value is a ref, or it simply returns the value itself if it's not a ref.

## Usage

### Unwrapping a Ref

To safely retrieve the original value from a ref or non-ref value, you can use the `unref` function.

```ts
import { unref } from 'regor'

const myValue = /* Your ref or non-ref value here */

const unwrappedValue = unref(myValue)
```

## Parameters

- `value`: The value you want to unwrap. It can be a ref object or a non-ref value.

## Return Value

- The `unref` function returns the original value if the provided `value` is a ref. If `value` is not a ref, it returns the same `value` itself.

## Example

```ts
import { ref, unref } from 'regor'

const myRef = ref('Hello, Regor!')

// Unwrapping a ref value
const unwrappedValue = unref(myRef)
console.log(unwrappedValue) // Outputs 'Hello, Regor!'

const nonRefValue = 'This is not a ref.'

// Unwrapping a non-ref value (no change)
const sameValue = unref(nonRefValue)
console.log(sameValue) // Outputs 'This is not a ref.'
```

## See Also

- [`ref`](/api/ref)
- [`isDeepRef`](/api/isDeepRef)
- [`isRef`](/api/isRef)
- [`observe`](/api/observe)
- [`sref`](/api/sref)
- [`flatten`](/api/flatten)
- [`isRaw`](/api/isRaw)
- [`markRaw`](/api/markRaw)
- [`pause`](/api/pause)
- [`resume`](/api/resume)
- [`trigger`](/api/trigger)

[Back to the API list](/api/)
