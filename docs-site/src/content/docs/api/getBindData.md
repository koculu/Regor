---
title: getBindData
---


## Overview

The `getBindData` function is used to retrieve or create a BindData object associated with a DOM node. The BindData object contains information about bound data and associated unbinders for Regor.

## Usage

### Retrieving or Creating BindData

To retrieve the BindData associated with a DOM node, call the `getBindData` function with the DOM node as the parameter. If a BindData object is already associated with the node, it will be returned. If not, a new BindData object will be created and associated with the node.

### Example

```javascript
import { getBindData } from 'regor'

// Retrieve or create BindData for a DOM node
const someElement = document.getElementById('example')
const bindData = getBindData(someElement)

// Access the BindData properties
console.log(bindData.data) // Access bound data
console.log(bindData.unbinders) // Access associated unbinders
```

## Parameters

- `node`: The DOM node for which you want to retrieve or create the associated BindData object.

## Return Value

The `getBindData` function returns a `BindData` object associated with the provided DOM node. This object contains the following properties:

- `unbinders`: An array of unbinders that can be used to remove bound data and associated logic from the DOM node.

- `data`: A record of bound data, where keys represent data properties, and values represent the associated data.

## Notes

- The `getBindData` function is typically used internally within Regor to manage bound data and unbinders associated with DOM nodes.

- It provides a way to access and manipulate the bound data and unbinders for a specific DOM element.

- BindData objects are created and associated with DOM nodes as needed when data is bound to elements using Regor.

- The `unbind` function can be used to remove bound data and associated unbinders from a DOM node, effectively cleaning up any Regor-related bindings.

- This function is primarily intended for use in advanced scenarios where direct access to Regor's internal data management is required.

## See Also

- [addUnbinder](/api/addUnbinder)
- [removeNode](/api/removeNode)
- [unbind](/api/unbind)

[Back to the API list](/api/regor-api)
