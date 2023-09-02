# `resume`

## Overview

The `resume` function is used to resume the automatic triggering of observers for a specific ref that has previously been paused using the `pause` function. When a ref is resumed, its observers are reactivated, and changes to the ref's value will once again trigger observer callbacks.

## Usage

### Resuming Observers

To resume the observers of a specific ref, call the `resume` function with the ref as the `source` argument. This will reactivate the observers associated with the ref.

```ts
import { pause, resume, ref, observe } from 'regor'

const myRef = ref(5)

observe(myRef, () => {
  console.log('Observer triggered:', myRef.value)
})

myRef.value = 10 // The observer is automatically triggered

// Pause the observers of myRef
pause(myRef)

myRef.value = 15 // The observer is not triggered

// Resume the observers of myRef
resume(myRef)

myRef.value = 20 // The observer is triggered again

// Outputs:
// Observer triggered: 10
// Observer triggered: 20
```

## Parameters

- `source`: The ref for which you want to resume the automatic triggering of observers.

## Notes

- The `resume` function is used to reactivate observers for a ref that has previously been paused using the `pause` function. This allows you to continue receiving observer notifications when changes are made to the ref's value.

- Resuming a ref's observers does not trigger observer callbacks for past changes made while the ref was paused. Only future changes to the ref's value will trigger observers.

## See Also

- [`ref`](ref.md)
- [`observe`](observe.md)
- [`trigger`](trigger.md)
- [`pause`](pause.md)

[Back to the API list](regor-api.md)
