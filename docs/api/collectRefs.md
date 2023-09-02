# `collectRefs`

## Overview

The `collectRefs` function is a utility provided by Regor. It allows you to collect a set of reactive references (refs) within a specific scope and return both the result of an action and the collected refs. This is useful for managing and tracking the refs used within a certain code block.

## Usage

### Collecting Refs

To collect refs using `collectRefs`, you provide an action function that performs some logic involving refs. The function will execute within a scope where the refs are collected, and you can access the collected refs along with the result of the action.

```ts
import { collectRefs, ref } from 'regor'

const myRef1 = ref(5)
const myRef2 = ref('Hello')

const { value, refs } = collectRefs(() => {
  console.log(myRef1.value)
  myRef2.value = 'World'
})

console.log(value) // Outputs undefined (result of the action)
console.log(refs) // Outputs an array containing myRef1 and myRef2
```

## Parameters

- `action`: A function that performs some logic and may involve reactive refs. The function is executed within a scope where the refs are collected.

## Return Value

- The `collectRefs` function returns an object with two properties:
  - `value`: The result of the action function.
  - `refs`: An array containing the collected refs used within the action function.

## Example

```ts
import { collectRefs, ref } from 'regor'

const myRef1 = ref(5)
const myRef2 = ref('Hello')

const { value, refs } = collectRefs(() => {
  console.log(myRef1.value)
  myRef2.value = 'World'
})

console.log(value) // Outputs undefined (result of the action)
console.log(refs) // Outputs an array containing myRef1 and myRef2
```

## See Also

- [`ref`](ref.md)
- [`observe`](observe.md)
- [`observeMany`](observeMany.md)
- [`computed`](computed.md)
- [`watchEffect`](watchEffect.md)
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
