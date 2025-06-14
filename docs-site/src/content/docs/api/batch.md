---
title: batch
---


## Overview

The `batch` function is used to batch multiple updates to refs, which can help optimize performance by reducing the number of observer notifications and triggers during a series of updates. When multiple changes to refs are made within a `batch` block, observers are only notified once, at the end of the batch.

## Usage

### Batching Updates

To batch updates to refs, wrap the code that performs the updates within a `batch` function call. The `batch` function takes an `updater` function as an argument, and all updates made within the `updater` function are batched together.

```ts
import { batch, ref } from 'regor'

const myRef1 = ref(5)
const myRef2 = ref(10)

batch(() => {
  myRef1.value = 15
  myRef2.value = 20
})

// Observers are notified only once at the end of the batch
// Outputs:
// Observer triggered: 20
```

## Parameters

- `updater`: A function that contains the updates to refs that should be batched together. Any changes made to refs within this function will be batched.

## Notes

- Batching updates with the `batch` function can help improve the performance of your application when multiple changes are made to refs in a short period. It reduces the number of observer notifications and triggers, which can be especially beneficial in situations with complex reactivity logic.

- When using the `batch` function, observers associated with refs will be notified once, at the end of the batch, rather than for each individual update. This can lead to more efficient reactivity handling.

- The `batch` function can be particularly useful when performing multiple ref updates within a loop or in response to user interactions.

- Important: When using the batch function, keep in mind that reads of refs within the batch can return potentially stale or outdated values due to pausing auto-updates. Ensure that your code logic accounts for this situation when reading refs within a batch.

## See Also

- [`startBatch`](../startBatch.md)
- [`endBatch`](../endBatch.md)
- [`ref`](../ref.md)
- [`sref`](../sref.md)
- [`trigger`](../trigger.md)
- [`observe`](../observe.md)

[Back to the API list](../regor-api.md)
