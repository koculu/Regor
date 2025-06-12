---
title: :ref Directive
---

# :ref Directive

The `:ref` directive in Regor allows you to create references to HTML elements within your templates. These references enable you to interact with and manipulate specific DOM elements programmatically in your components.

## Syntax

```html
<element :ref="expression"></element>
```

- `<element>`: The HTML element to which you want to apply the `:ref` directive.
- `expression`: An expression represents a property in your component's context.

## Usage

The `:ref` directive is used to establish a reference to an HTML element. This reference can be accessed within your component's code, providing a way to interact with the element, modify its properties, or attach event listeners to it.

### Example

Consider the following example:

```html
<div id="app">
  <button @click="handleButtonClick">Click me</button>
  <input :ref="inputRef" type="text" />
</div>
```

```ts
import { createApp, ref } from 'regor'
createApp({
  inputRef: ref<HTMLElement>(), // Initialize the reference
  handleButtonClick() {
    // Access the input element using the reference
    this.inputRef()?.focus()
  },
})
```

In this example, the `:ref` directive is applied to the `<input>` element, creating a reference named `inputRef`. When the button is clicked, the `handleButtonClick` method is called, and it uses the reference to focus on the input element.

## Use Cases

The `:ref` directive is useful in various scenarios, including:

1. **Interacting with DOM Elements**: You can use `:ref` to gain direct access to specific HTML elements in your component, allowing you to manipulate their properties, apply custom styling, or interact with them in response to user actions.

2. **Attaching Event Listeners**: By referencing elements, you can attach event listeners to them dynamically. For example, you can attach a click event listener to a referenced button element.

3. **Integrating Third-Party Libraries**: When working with third-party libraries or components that require direct access to DOM elements, using `:ref` provides a way to pass those elements to external libraries.

## Notes

- The `:ref` directive establishes a reference to the HTML element in the component's data, making it accessible via the specified reference name.

- You can create references to multiple elements within your template by applying `:ref` to each of them with unique reference names.

- The same reference name can be shared across elements to collect multiple elements in an array.

- The `:ref` directive is particularly valuable when you need to work with specific DOM elements that are part of your template but require dynamic interaction or customization.

By using the `:ref` directive in your Regor templates, you can bridge the gap between your component's JavaScript logic and the HTML elements in your template, enhancing your ability to create dynamic and interactive user interfaces.

[Back to the directives](directives.md)
