---
title: sref
---


## Overview

The `sref` function converts a given value into an sref (short for "simple ref") object and returns the sref. An sref allows you to both retrieve and update its value.

The nested properties of an sref are not converted to refs.

[**`Try It Online`**](https://stackblitz.com/edit/regor-sample-ref?file=index.ts)

## Usage

### Getting the SRef Value

You can access the value of the sref object using two methods:

1. `srefObj.value`: Accesses the value directly.
2. `srefObj()`: Invokes the sref object to retrieve its value.

### Setting the SRef Value

To update the value of an sref object, you have two options:

1. `srefObj.value = newValue`: Sets the value directly.
2. `srefObj(newValue)`: Invokes the sref object with the new value to update it.

## Parameters

- `value` (optional): Any value that you want to convert into an sref object. The function supports several input types:

  - Basic types such as numbers, strings, booleans, Date etc.
  - sref objects.
  - objects
  - Array, Map, Set.
  - `null` or `undefined`.

## Return Value

The `sref` function returns an sref object representing the input value. The specific type of the returned sref object depends on the input value's type.

## Notes

- `sref` modifies prototype of arrays, maps, and sets to make them reactive.

- Observers can be attached to the sref object to be notified of changes to its value.

- The function also supports batch collecting changes and pausing/resuming auto-triggering of observers.
- Every `ref` is an `sref`, but not every `sref` is a `ref`.

## Example

```ts
import { sref } from 'regor'

const initialValue = {
  name: 'John',
  age: 30,
  hobbies: ['reading', 'swimming'],
}

const mySRef = sref(initialValue)

// Accessing the sref value using function call
console.log(mySRef()) // Outputs the initial value

// Accessing the sref value using value getter
console.log(mySRef.value) // Outputs the initial value

// Updating the sref value
mySRef().name = 'Alice' // Directly modifying the sref value
console.log(mySRef().name) // Outputs 'Alice'

mySRef({
  name: 'Alice',
  age: 35,
  hobbies: ['reading', 'swimming'],
}) // Invoking the sref with a new value
console.log(mySRef().age) // Outputs 35
```

## See Also

- [`ref`](../ref.md)
- [`isDeepRef`](../isDeepRef.md)
- [`isRef`](../isRef.md)
- [`unref`](../unref.md)
- [`observe`](../observe.md)
- [`flatten`](../flatten.md)
- [`isRaw`](../isRaw.md)
- [`markRaw`](../markRaw.md)
- [`pause`](../pause.md)
- [`resume`](../resume.md)
- [`trigger`](../trigger.md)

[Back to the API list](../regor-api.md)
