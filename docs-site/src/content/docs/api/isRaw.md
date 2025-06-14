---
title: isRaw
---


## Overview

The `isRaw` function determines whether a given value has been marked as "raw" using the `markRaw` function, indicating that it should not be deeply converted into a deep ref when using the `ref` function.

## Usage

### Checking for Raw Value

To check if a value is marked as raw, you can use the `isRaw` function.

```ts
import { isRaw } from 'regor'

const myValue = /* Your value here */

if (isRaw(myValue)) {
  console.log('The value is marked as raw.')
} else {
  console.log('The value is not marked as raw.')
}
```

## Parameters

- `value`: The value you want to check for being marked as raw.

## Return Value

- The `isRaw` function returns `true` if the provided `value` is marked as raw using `markRaw`, and `false` otherwise.

## Implementation Details

- The function checks if the provided value has a property marked with the `rawSymbol` set to `1`, indicating that it is marked as raw.

## Example

```ts
import { markRaw, isRaw } from 'regor'

const data = {
  name: 'Alice',
  age: 30,
  rawProperty: markRaw({ nested: 'value' }),
}

// Check if rawProperty is marked as raw
if (isRaw(data.rawProperty)) {
  console.log('The rawProperty is marked as raw.')
} else {
  console.log('The rawProperty is not marked as raw.')
}
```

## See Also

- [`markRaw`](markRaw.md)
- [`ref`](ref.md)
- [`isDeepRef`](isDeepRef.md)
- [`isRef`](isRef.md)
- [`unref`](unref.md)
- [`observe`](observe.md)
- [`sref`](sref.md)
- [`flatten`](flatten.md)
- [`pause`](pause.md)
- [`resume`](resume.md)
- [`trigger`](trigger.md)

[Back to the API list](regor-api.md)
