---
title: addUnbinder
---

# `addUnbinder`

## Overview

The `addUnbinder` function is used to associate an unbinder function with a DOM node in Regor. An unbinder function is used to remove bound data and associated logic from the DOM node when necessary.

## Usage

### Associating an Unbinder Function

To associate an unbinder function with a DOM node, call the `addUnbinder` function with the following parameters:

- `node`: The DOM node to which you want to associate the unbinder function.

- `unbinder`: A function that can be executed later to remove bound data and associated logic from the DOM node.

### Example

```javascript
import { addUnbinder } from 'regor'

// Create an unbinder function
const myUnbinder = () => {
  // Remove bound data and associated logic
  // ...
}

// Associate the unbinder function with a DOM node
const someElement = document.getElementById('example')
addUnbinder(someElement, myUnbinder)
```

## Parameters

- `node`: The DOM node to which you want to associate the unbinder function.

- `unbinder`: A function that can be executed later to remove bound data and associated logic from the DOM node.

## Notes

- The `addUnbinder` function is typically used internally within Regor to manage unbinder functions associated with DOM nodes.

- It provides a way to associate an unbinder function with a specific DOM element, allowing for the clean removal of bound data and logic when needed.

- Unbinder functions are typically created and associated with DOM nodes as part of the data binding process in Regor.

- The unbinder function, when executed, should perform any necessary cleanup or removal of data bindings and associated logic from the DOM node.

- This function is primarily intended for use in advanced scenarios where direct access to Regor's internal data management is required.

## See Also

- [removeNode](removeNode.md)
- [unbind](unbind.md)
- [getBindData](getBindData.md)

[Back to the API list](regor-api.md)
