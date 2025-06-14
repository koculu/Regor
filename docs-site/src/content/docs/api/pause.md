---
title: pause
---


## Overview

The `pause` function is used to pause the automatic triggering of observers for a specific ref. When a ref is paused, its observers are temporarily deactivated, and changes to the ref's value will not trigger observer callbacks until it is resumed using the `resume` function.

## Usage

### Pausing Observers

To pause the observers of a specific ref, call the `pause` function with the ref as the `source` argument. This will temporarily deactivate the observers associated with the ref.

```ts
import { pause, ref, observe } from 'regor'

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

- `source`: The ref for which you want to pause the automatic triggering of observers.

## Notes

- The `pause` function is useful when you want to temporarily disable observer notifications for a ref, allowing you to make multiple changes to the ref's value without triggering observers in between.

- Pausing a ref does not prevent manual triggering of observers using the `trigger` function.

- To resume the observers of a paused ref, use the `resume` function.

## See Also

- [`ref`](ref.md)
- [`sref`](sref.md)
- [`observe`](observe.md)
- [`trigger`](trigger.md)
- [`resume`](resume.md)

[Back to the API list](regor-api.md)
