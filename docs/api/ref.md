# `ref`

## Overview

The `ref` function is a utility provided by Regor. It converts a given value and its nested properties into ref objects recursively, returning a ref object that reflects the structure of the input value.

[**`Try It Online`**](https://stackblitz.com/edit/regor-sample-ref?file=index.ts)

## Usage

### Getting the Ref Value

You can access the value of the ref object using two methods:

1. `refObj.value`: Accesses the value directly.
2. `refObj()`: Invokes the ref object to retrieve its value.

### Setting the Ref Value

To update the value of a ref object, you have two options:

1. `refObj.value = newValue`: Sets the value directly.
2. `refObj(newValue)`: Invokes the ref object with the new value to update it.

## Parameters

- `value` (optional): Any value that you want to convert into a ref object. The function supports several input types:

  - Basic types such as numbers, strings, booleans, Date etc.
  - ref objects.
  - objects
  - Array, Map, Set.
  - `null` or `undefined`.

## Return Value

The `ref` function returns a ref object representing the input value and its nested properties. The specific type of the returned ref object depends on the input value's type.

## Notes

- Certain types such as Node, Date, RegExp, Promise, and Error are not recursively converted into ref objects. They are treated as-is and returned as the value of the ref object.
- Arrays and objects are recursively traversed to convert their nested properties into ref objects.
- Symbols are not converted into ref objects, and the original symbols are preserved in the resulting ref object.
- Observers can be attached to the ref object to be notified of changes to its value.
- Every `ref` is an `sref`, but not every `sref` is a `ref`.

## Example

```ts
import { ref } from 'regor'

interface Address {
  city: string
  state: string
}

interface User {
  name: string
  age: number
  address?: Address
}

const initialValue: User = {
  name: 'John',
  age: 30,
  address: {
    city: 'New York',
    state: 'NY',
  },
}

// create ref from initialValue.
// ref call replaces initial value's nested properties with ref objects recursively in place.
const myRef = ref<User>(initialValue) // returned type is Ref<User>

// Accessing the ref value using function call
console.log(myRef()) // Outputs the initial value

// Accessing the ref value using value getter
console.log(myRef.value) // Outputs the initial value

// Updating the ref value
myRef().name('Alice') // Modifying the ref value using function call
console.log(myRef().name()) // Outputs 'Alice'

// Updating the ref value using value using setter
myRef().name.value = 'Alice' // Modifying the ref value
console.log(myRef().name.value) // Outputs 'Alice'

myRef(
  ref({
    name: 'Alice',
    age: 35,
  }),
) // Invoking the ref with a new value
console.log(myRef().age()) // Outputs 35
```

## See Also

- [`sref`](sref.md)
- [`isDeepRef`](isDeepRef.md)
- [`isRef`](isRef.md)
- [`unref`](unref.md)
- [`observe`](observe.md)
- [`flatten`](flatten.md)
- [`isRaw`](isRaw.md)
- [`markRaw`](markRaw.md)
- [`pause`](pause.md)
- [`resume`](resume.md)
- [`trigger`](trigger.md)

[Back to the API list](regor-api.md)
