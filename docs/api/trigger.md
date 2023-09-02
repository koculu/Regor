# `trigger`

## Overview

The `trigger` function is a utility provided by Regor. It is used to manually trigger observers and update dependent refs. This function is particularly useful when you need to manually control when ref updates and observer notifications occur.

## Usage

### Manually Triggering Observers

To manually trigger observers for a specific ref, call the `trigger` function with the ref as the `source` argument. This will notify all observers of the ref and update any dependent refs.

```ts
import { trigger, ref, observe } from 'regor'

const myRef = ref(5)

observe(myRef, () => {
  console.log('Observer triggered:', myRef.value)
})

myRef.value = 10 // The observer is automatically triggered

// Manually trigger the observer
trigger(myRef)

// Outputs:
// Observer triggered: 10
```

### Recursive Triggering

By default, the `trigger` function only notifies observers of the specified ref. If you want to trigger observers recursively for nested refs within arrays, sets, maps, or objects, you can set the `isRecursive` argument to `true`. This will trigger observers for all nested refs.

```ts
import { trigger, ref, observe } from 'regor'

const myRef = ref([1, 2, 3])

observe(myRef, () => {
  console.log('Observer triggered:', myRef.value)
})

myRef.value.push(4) // The observer is automatically triggered

// Manually trigger the observer recursively
trigger(myRef, undefined, true)

// Outputs:
// Observer triggered: [1, 2, 3, 4]
```

## Parameters

- `source`: The ref for which you want to manually trigger observers.
- `eventSource` (optional): An optional event source that can be provided to identify the source of the trigger. This can be useful for debugging and tracking trigger events.
- `isRecursive` (optional): A boolean flag that, when set to `true`, triggers observers recursively for nested refs within arrays, sets, maps, and objects. By default, this is set to `false`.

## Notes

- The `trigger` function is typically used for advanced scenarios where manual control over observer notifications is required. In most cases, observers are automatically notified when a ref's value changes.

- Recursive triggering can be resource-intensive if there are deep and complex nested structures. Use it judiciously to avoid unnecessary performance overhead.

## See Also

- [`ref`](ref.md)
- [`sref`](sref.md)
- [`observe`](observe.md)
- [`unref`](unref.md)
- [`isRef`](isRef.md)
- [`isDeepRef`](isDeepRef.md)
- [`computed`](computeRef.md)
- [`watchEffect`](watchEffect.md)

[Back to the API list](regor-api.md)
