---
title: unbind
---


## Overview

The `unbind` function in Regor is responsible for removing bound data and associated logic from a DOM node and its descendants. This function is crucial for cleaning up data bindings and event listeners when elements are removed from the DOM or when they are no longer needed.

## Usage

### Removing Bound Data and Logic

The `unbind` function takes a single parameter:

- `node`: The DOM node from which you want to start the unbinding process. The function will recursively unbind data and logic from this node and its descendants.

### Example

```javascript
import { unbind } from 'regor'

// Remove bound data and associated logic from a DOM node and its descendants
const someElement = document.getElementById('example')
unbind(someElement)
```

## Parameters

- `node`: The DOM node from which you want to start the unbinding process. The function will recursively unbind data and logic from this node and its descendants.

## Notes

- The `unbind` function is typically used internally within Regor to clean up data bindings and event listeners associated with DOM nodes that are being removed or are no longer needed.

- When called on a specific DOM node, the function recursively traverses all child nodes, unbinding data and logic as it goes.

- The primary purpose of this function is to ensure that there are no memory leaks or lingering event listeners when elements are removed from the DOM.

- It is essential to call the `unbind` function when elements are removed from the DOM manually or as part of a Regor component's lifecycle management.

- In most cases, you do not need to call this function explicitly, as Regor handles the unbinding process automatically when components are unmounted or when elements are removed from the DOM through Regor's rendering and cleanup mechanisms.

## See Also

- [addUnbinder](/api/addUnbinder)
- [removeNode](/api/removeNode)
- [getBindData](/api/getBindData)

[Back to the API list](/api/regor-api)
