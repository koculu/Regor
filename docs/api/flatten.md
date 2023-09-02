# `flatten`

## Overview

The `flatten` function recursively traverses a nested structure, such as an object, array, set, or map, and returns a flattened version of the structure. This means that it removes any nested references and produces a structure containing no refs.

## Usage

### Flattening Nested Structures

To flatten a nested structure, simply pass the reference to the `flatten` function. It will return a new structure with all nested references removed.

```ts
import { flatten, ref } from 'regor'

const nestedData = {
  name: 'John',
  age: ref(30),
  hobbies: ['reading', 'swimming', ref('drawing')],
}

const flattenedData = flatten(nestedData)

console.log(flattenedData)
// Outputs: { name: 'John', age: 30, hobbies: [ 'reading', 'swimming', 'drawing' ] }
```

## Parameters

- `reference`: The nested structure (object, array, set, map) that you want to flatten. It can contain nested refs, which will be resolved during flattening.

## Return Value

- The `flatten` function returns a new structure that is a flattened version of the input `reference`. Any nested refs within the structure are resolved, resulting in a single-level structure.

## Notes

- The `flatten` function recursively flattens nested structures, including arrays, sets, maps, and objects.

- If the input `reference` contains refs, they are automatically unrefed during flattening, and their values are included in the flattened structure.

- Circular references within the input `reference` are not supported, and attempting to flatten such structures may result in unexpected behavior.

## Example

```ts
import { flatten, ref } from 'regor'

const nestedData = {
  name: 'John',
  age: ref(30),
  hobbies: ['reading', 'swimming', ref('drawing')],
}

const flattenedData = flatten(nestedData)

console.log(flattenedData)
// Outputs: { name: 'John', age: 30, hobbies: [ 'reading', 'swimming', 'drawing' ] }
```

## See Also

- [`ref`](sref.md)
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
