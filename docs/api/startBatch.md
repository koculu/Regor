# `startBatch`

## Overview

The `startBatch` function is used in conjunction with the `batch` function to batch multiple updates to refs, optimizing performance by reducing the number of observer notifications and triggers during a series of updates. The `startBatch` function initializes a batch operation, and any ref updates made after calling `startBatch` are batched together until the `endBatch` function is called.

## Usage

### Starting a Batch

To start a batch of ref updates, call the `startBatch` function. Once a batch is started, any subsequent changes made to refs are considered part of that batch and are not immediately observed or triggered. Instead, observers are notified only once at the end of the batch.

```javascript
import { batch, startBatch, endBatch, ref } from 'regor'

const myRef1 = ref(5)
const myRef2 = ref(10)

startBatch() // Start a batch

myRef1.value = 15
myRef2.value = 20

endBatch() // End the batch

// Observers are notified only once at the end of the batch
// Outputs:
// Observer triggered: 20
```

## Notes

- The `startBatch` function is used in conjunction with the `endBatch` function to group ref updates together within a batch. After starting a batch with `startBatch`, any subsequent changes to refs are included in that batch until the `endBatch` function is called.

- Batching updates with the `startBatch` and `endBatch` functions can help improve the performance of your application when multiple changes are made to refs in a short period. It reduces the number of observer notifications and triggers, which can be especially beneficial in situations with complex reactivity logic.

- It's essential to call the `endBatch` function to finalize the batch and notify observers of the ref updates made during the batch.

- Important: When using the batch functions, keep in mind that reads of refs within the batch can return potentially stale or outdated values due to pausing auto-updates. Ensure that your code logic accounts for this situation when reading refs within a batch.

## See Also

- [`endBatch`](endBatch.md)
- [`batch`](batch.md)
- [`ref`](ref.md)
- [`sref`](sref.md)
- [`trigger`](trigger.md)

[Back to the API list](regor-api.md)
