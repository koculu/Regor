# `endBatch`

## Overview

The `endBatch` function is used in conjunction with the `startBatch`function to end a batch of ref updates and notify observers of the changes made during the batch. Batching ref updates using `startBatch` and `endBatch` can improve application performance by reducing the number of observer notifications and triggers during a series of updates.

## Usage

### Ending a Batch

To end a batch of ref updates, call the `endBatch` function. When a batch is ended, observers are notified of the changes made to refs during the batch, but this notification is performed only once, optimizing performance.

```ts
import { batch, startBatch, endBatch, ref } from 'regor'

const myRef1 = ref(5)
const myRef2 = ref(10)

startBatch() // Start a batch

myRef1.value = 15
myRef2.value = 20

endBatch() // End the batch and notify observers

// Observers are notified only once at the end of the batch
// Outputs:
// Observer triggered: 20
```

## Notes

- The `endBatch` function is used in conjunction with the `startBatch` function to finalize a batch of ref updates. It ensures that observers are notified of the ref changes made during the batch in an optimized manner, reducing unnecessary notifications.

- Batching updates with `startBatch` and `endBatch` can significantly improve the performance of your application, especially when multiple changes are made to refs in rapid succession. It minimizes the number of observer notifications and triggers.

- It's important to call the `endBatch` function to conclude a batch and ensure that observers are informed of the changes made during the batch.

- Important: When using the batch functions, keep in mind that reads of refs within the batch can return potentially stale or outdated values due to pausing auto-updates. Ensure that your code logic accounts for this situation when reading refs within a batch.

## See Also

- [`startBatch`](startBatch.md)
- [`batch`](batch.md)
- [`ref`](ref.md)
- [`sref`](sref.md)
- [`trigger`](trigger.md)

[Back to the API list](regor-api.md)
