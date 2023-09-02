# `silence`

## Overview

The `silence` function is an internal utility provided by Regor. It is used to temporarily suspend the normal behavior of collecting refs within the callback of `watchEffect`, `computed` or `collectRefs`. This allows you to perform actions on refs excluded from normal behavior of `watchEffect`, `computed` or `collectRefs`. It is useful in specific scenarios when you want to prevent ref collection for some refs.

## Usage

### Silencing Ref Collection

To temporarily suspend ref collection within the callback of `watchEffect`, `computed` or `collectRefs`, you can wrap your action function with `silence`.

```ts
import { silence, watchEffect, ref } from 'regor'

const myRef = ref(5)
const anotherRef = ref(7)

watchEffect(() => {
  console.log(myRef.value) // myRef is collected and will be observed.

  silence(() => {
    anotherRef.value = 10 // anotherRef is excluded from the ref collection and will not be observed.
    console.log(anotherRef.value)
  })
})

myRef.value = 8 // watchEffect's callback will be invoked.
anotherRef.value = 9 // watchEffect's callback will not be invoked
```

## Parameters

- `action`: A function that performs some logic within the callback of `watchEffect`, `computed` or `collectRefs` but temporarily suspends ref collection. The function is executed within a scope where ref collection is silenced.

## Return Value

- The `silence` function returns the result of the action function, allowing you to access the outcome of the action.

## Example

```ts
import { silence, watchEffect, ref } from 'regor'

const myRef = ref(5)

watchEffect(() => {
  console.log(myRef.value) // Outputs 5

  silence(() => {
    myRef.value = 10
    console.log(myRef.value) // Outputs 10
  })

  console.log(myRef.value) // Outputs 10
})
```

## See Also

- [`ref`](ref.md)
- [`computed`](computed.md)
- [`observe`](observe.md)
- [`observeMany`](observeMany.md)
- [`computed`](computed.md)
- [`watchEffect`](watchEffect.md)
- [`collectRefs`](collectRefs.md)
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
