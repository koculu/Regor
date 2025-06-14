---
title: markRaw
---

## Overview

The `markRaw` function allows you to mark a given value as "raw," indicating that it should not be converted into a deep ref when using the `ref` function. Marking a value as "raw" ensures that specific nested properties or the entire object will remain untracked and not reactive.

## Usage

### Marking a Value as Raw

To mark a value as raw, you can use the `markRaw` function.

```ts
import { markRaw } from 'regor'

const myValue = /* Your object here */

// Marking the object as raw
const rawValue = markRaw(myValue)
```

## Parameters

- `value`: The object or value you want to mark as raw, preventing it from being deeply converted into a ref object.

## Return Value

- The `markRaw` function returns the same value that you passed as an argument, but with an additional marker indicating it is a raw value.

## Implementation Details

- The function sets a marker on the provided value using the `rawSymbol` to indicate that it should not be deeply converted into a ref.
- The marked object remains untracked when used with the `ref` function.

## Example

```ts
import { markRaw, ref } from 'regor'

const data = {
  name: 'Alice',
  age: 30,
  rawProperty: markRaw({ nested: 'value' }),
}

const myRef = ref(data)

// Changes to rawProperty will not trigger reactivity
myRef().rawProperty.nested = 'updated value'
console.log(myRef().rawProperty.nested) // Outputs 'updated value'
```

## See Also

- [`ref`](/api/ref)
- [`sref`](/api/sref)
- [`isDeepRef`](/api/isDeepRef)
- [`isRef`](/api/isRef)
- [`unref`](/api/unref)
- [`observe`](/api/observe)
- [`flatten`](/api/flatten)
- [`isRaw`](/api/isRaw)
- [`pause`](/api/pause)
- [`resume`](/api/resume)
- [`trigger`](/api/trigger)

[Back to the API list](/api/)
