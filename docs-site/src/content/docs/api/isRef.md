---
title: isRef
---


## Overview

The `isRef` function determines whether a given value is a ref object, indicating that it has been converted into a ref using the `ref`, `sref` or `computed` functions.

## Usage

### Checking for Ref

To check if a value is a ref, you can use the `isRef` function.

```ts
import { isRef } from 'regor'

const myValue = /* Your value here */

if (isRef(myValue)) {
  console.log('The value is a ref.')
} else {
  console.log('The value is not a ref.')
}
```

## Parameters

- `value`: The value you want to check for being a ref object.

## Return Value

- The `isRef` function returns `true` if the provided `value` is a ref object, and `false` otherwise.

## Example

```ts
import { isRef } from 'regor'

const refValue = /* A ref value created using the ref or sref function */

if (isRef(refValue)) {
  console.log('This value is a ref object.')
} else {
  console.log('This value is not a ref object.')
}
```

## See Also

- [`ref`](/api/ref)
- [`sref`](/api/sref)
- [`isDeepRef`](/api/isDeepRef)
- [`unref`](/api/unref)
- [`observe`](/api/observe)
- [`flatten`](/api/flatten)
- [`isRaw`](/api/isRaw)
- [`markRaw`](/api/markRaw)
- [`pause`](/api/pause)
- [`resume`](/api/resume)
- [`trigger`](/api/trigger)

[Back to the API list](/api/regor-api)
