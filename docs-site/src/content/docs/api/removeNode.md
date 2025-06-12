---
title: removeNode
---

# `removeNode`

## Overview

The `removeNode` function in Regor is responsible for removing a DOM node and initiating the unbinding process to clean up associated data bindings and event listeners. This function ensures that elements are safely removed from the DOM while also releasing any resources associated with them.

## Usage

### Removing a DOM Node and Unbinding

The `removeNode` function takes a single parameter:

- `node`: The DOM node you want to remove from the document. This function will also initiate the unbinding process to clean up associated data bindings and event listeners.

### Example

```javascript
import { removeNode } from 'regor'

// Remove a DOM node and clean up associated data bindings and event listeners
const someElement = document.getElementById('example')
removeNode(someElement)
```

## Parameters

- `node`: The DOM node you want to remove from the document. This function will also initiate the unbinding process to clean up associated data bindings and event listeners.

## Notes

- The `removeNode` function is used to safely remove a DOM node from the document while ensuring that any bound data and associated logic are properly unbound and cleaned up.

- When called on a specific DOM node, the function also initiates the unbinding process, which includes removing event listeners and cleaning up data bindings associated with the node and its descendants.

- This function is typically used internally within Regor to facilitate the cleanup process when components are unmounted or when elements are removed from the DOM as part of Regor's rendering and lifecycle management.

- It is essential to use the `removeNode` function or Regor's lifecycle management mechanisms when removing elements from the DOM to prevent memory leaks and ensure proper cleanup.

## See Also

- [addUnbinder](addUnbinder.md)
- [unbind](unbind.md)
- [getBindData](getBindData.md)

[Back to the API list](regor-api.md)
