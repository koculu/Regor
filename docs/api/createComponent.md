# `createComponent`

## Overview

The `createComponent` function is used to create a Regor component, which encapsulates a part of your user interface (UI) with its own behavior and template. Components allow you to build complex UIs by composing smaller, reusable units.

## Usage

### Creating a Regor Component

To create a Regor component, call the `createComponent` function with the following parameters:

- `context` (required): A function that defines the Regor context for the component. This function receives a `ComponentHead` object, which you can use to specify the component's behavior and props. It should return the Regor context.

- `templateOptions` (required): An HTML string or an object specifying the template for rendering the component. It can include the following properties:

  - `selector` (string, optional): A CSS selector string for the root element of the component. Regor will attempt to find this element in the DOM.
  - `element` (Element, optional): A reference to the root DOM element of the component. If provided, this element will be used as the component's template.
  - `template` (string, optional): An HTML string representing the initial content of the component's root element.
  - `json` (object, optional): A JSON object representing the initial structure of the component's UI.
  - `isSVG` (boolean, optional): Indicates whether the template contains SVG elements.

- `options` (optional): An array of strings that defines component properties or an object that allows you to configure various options for the component, such as whether to use interpolation, props, or the component's default name.

### Example

```ts
import { createComponent, createApp, html } from 'regor'

// Define a Regor component
const myComponent = createComponent(
  (head) => ({
    // Define the component's context and behavior here
    // ... other context properties
  }),
  html`<div></div>`, // Define the component content from html string
)

// Use the created component in your application
createApp({
  components: { myComponent },
})
```

## Parameters

- `context` (required): A function that defines the Regor context for the component. It should return the Regor context, which specifies the component's behavior and data.

- `templateOptions` (required): An HTML string or an object specifying the template for rendering the component. It defines the component's UI structure, either by selecting an existing DOM element or providing HTML content or a JSON structure.

- `options` (optional): An array of strings that defines component properties or an object that configures various options for the component, including whether to use interpolation, props, or the component's default name.

## Return Value

The `createComponent` function returns a component object with the following properties:

- `context`: The Regor context associated with the component. It defines the component's behavior, data, and reactivity.

- `template`: The template (root element) used for rendering the component's UI.

- `inheritAttrs`: A boolean indicating whether the component should inherit attributes from its parent. By default, it's set to `true`.

- `props`: An optional object specifying the component's props, if any. This allows you to define input properties for your component.

- `defaultName`: An optional default name for the component. This name can be used for debugging and identification purposes.

## Notes

- Components are a fundamental building block in Regor applications. They encapsulate UI elements, logic, and reactivity, making it easier to manage complex user interfaces.

- The `context` parameter defines the behavior and data of your component.

- The `templateOptions` parameter specifies how the component's UI is rendered. You can select an existing element in the DOM, provide HTML content, or use a JSON structure to define the component's structure.

- The `options` parameter allows you to configure various aspects of the component, such as enabling or disabling interpolation, specifying props, or setting a default name.

- Once a component is created, it can be used as a building block to construct your application's user interface.

## See Also

- [`createApp`](createApp.md)
- [`toFragment`](toFragment.md)
- [`toJsonTemplate`](toJsonTemplate.md)

[Back to the API list](regor-api.md)
