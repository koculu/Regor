---
title: isDeepRef
---


## Overview

The `isDeepRef` function determines whether a given value is a deep ref object, indicating that it has been deeply converted into a ref object using the `ref` function.

## Usage

### Checking for Deep Ref

To check if a value is a deep ref, you can use the `isDeepRef` function.

```ts
import { isDeepRef } from 'regor'

const myValue = /* Your value here */

if (isDeepRef(myValue)) {
  console.log('The value is a deep ref.')
} else {
  console.log('The value is not a deep ref.')
}
```

## Parameters

- `value`: The value you want to check for being a deep ref object.

## Return Value

- The `isDeepRef` function returns `true` if the provided `value` is a deep ref object, and `false` otherwise.

## Example

```ts
import { isDeepRef } from 'regor'

const deepRefValue = /* A deep ref value created using the ref function */

if (isDeepRef(deepRefValue)) {
  console.log('This value is a deep ref object.')
} else {
  console.log('This value is not a deep ref object.')
}
```

## See Also

- [`ref`](../ref.md)
- [`sref`](../ref.md)
- [`isRef`](../isRef.md)
- [`unref`](../unref.md)
- [`observe`](../observe.md)
- [`sref`](../sref.md)
- [`isRaw`](../isRaw.md)
- [`markRaw`](../markRaw.md)
- [`pause`](../pause.md)
- [`resume`](../resume.md)
- [`trigger`](../trigger.md)

[Back to the API list](../regor-api.md)
