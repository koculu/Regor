---
title: createApp
---

## Overview

The `createApp` function is the entry point for creating a Regor application. It allows you to bind a Regor context to a specified DOM element, effectively rendering and managing the dynamic behavior of your application.

## Usage

### Creating a Regor App

To create a Regor application, call the `createApp` function with the following parameters:

- `context` (required): The Regor context or scope that defines the application's behavior and data. It can be a context object or a scope created using [`useScope`](#useScope).

- `template` (optional): An HTML string or object specifying the template for rendering the application. It can include the following properties:

  - `selector` (string, optional): A CSS selector string for the root element of the application. If provided, Regor will attempt to find this element in the DOM.
  - `element` (Element, optional): A reference to the root DOM element of the application. If provided, this element will be used as the root.
  - `template` (string, optional): An HTML string representing the initial content of the root element.
  - `json` (object, optional): A JSON object representing the initial structure of the application's UI.
  - `isSVG` (boolean, optional): Indicates whether the template contains SVG elements.

- `config` (optional): An optional configuration object for customizing Regor's behavior.

### Example

```ts
import { createApp } from 'regor'

const appContext = {
  // Define your context here
}

// Create a Regor app
const app = createApp(appContext) // default template: { selector: '#app'}
```

## Parameters

- `context` (required): The Regor context or scope that defines the application's behavior and data.

- `template` (optional): An HTML string or an object specifying the template for rendering the application. This can include the root element's selector, element reference, HTML content, JSON structure, and SVG indication.

- `config` (optional): An optional configuration object that customizes Regor's behavior. It allows you to specify various options.

## Return Value

The `createApp` function returns an object with the following properties:

- `context`: The Regor context associated with the app.

- `unmount`: A function that unmounts the app by removing its root element from the DOM.

- `unbind`: A function that unbinds the app, removing all Regor bindings and event listeners associated with the app's root element, leaving the DOM as is.

## Notes

- `createApp` is typically called at the entry point of your application to initialize Regor and bind it to a specific DOM element.

- The `context` parameter defines the behavior and data of your application, allowing you to create reactive components and composable logic.

- The `template` parameter allows you to specify how the initial content or structure of the application should be rendered.

- When using table templates, Regor preprocesses template markup to preserve
  valid table structure for component-based rows and cells in `table`, `thead`,
  `tbody`, and `tfoot`.

- The `config` parameter lets you customize Regor's behavior to suit your application's requirements.

- You can use the `unmount` and `unbind` functions to clean up and remove the app from the DOM when it's no longer needed.

## See Also

- [`defineComponent`](/api/defineComponent)
- [`toFragment`](/api/toFragment)
- [`toJsonTemplate`](/api/toJsonTemplate)

[Back to the API list](/api/)
