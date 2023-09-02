# :class Directive

The `:class` directive in Regor allows you to dynamically apply CSS classes to HTML elements. It provides a way to bind and update the `class` attribute of an element based on data or expressions. With `:class`, you can create dynamic and responsive class-based styling for your components.

## Syntax

```html
<element :class="classObject"></element>
```

- `<element>`: The HTML element to which you want to apply CSS classes.
- `classObject`: An object, expression, or an array that defines the CSS classes to be applied. The object's keys represent class names, their values specify whether the class should be added or removed. In the array form, each element of the array represents a CSS class name.

## Usage

The `:class` directive is used to dynamically apply CSS classes to HTML elements based on data or expressions. It's a powerful tool for creating interactive and responsive UIs by toggling the presence of classes based on user interactions, data changes, or other dynamic conditions.

### Example

Here's an example of using the `:class` directive to toggle the visibility of an element by adding or removing a CSS class. This example demonstrates both the object and array forms of the directive:

```html
<div id="app">
  <button @click="toggleVisibility">Toggle Visibility</button>
  <!-- Object Form -->
  <div :class="{ 'hidden': isHidden }">
    This element can be hidden or shown.
  </div>

  <!-- Array Form -->
  <div :class="['custom-class', { 'active': isActive }]">
    Styled with custom classes.
  </div>

  <!-- Expression List -->
  <div :class="'custom-class', { 'active': isActive }">
    Styled with custom classes using Expression List.
  </div>
</div>
```

```ts
import { createApp, ref } from 'regor'

createApp({
  isHidden: ref(false),
  isActive: ref(false),
  toggleVisibility() {
    this.isHidden = !this.isHidden
  },
  toggleActiveState() {
    this.isActive = !this.isActive
  },
})
```

In this example, the `:class` directive binds the `class` attribute of the `div` elements to CSS classes using both object and array forms. The classes are added or removed based on the values of `isHidden` and `isActive` data properties.

## Use Cases

The `:class` directive is useful in various scenarios:

1. **Dynamic Classes**: You can use `:class` to dynamically add or remove CSS classes from elements in response to user actions or data changes. This is commonly used for toggling visibility, changing styles, or applying animations.

2. **Conditional Classes**: By binding the `:class` directive to an object or an array that contains class names and their conditions, you can conditionally apply classes based on certain conditions or flags in your application's state.

3. **Responsive Design**: `:class` can be used to create responsive layouts by applying different classes to elements based on screen size or other factors.

4. **Conditional Styling**: You can combine `:class` with `:style` to apply both dynamic styles and classes to elements, providing fine-grained control over the appearance of your components.

## Notes

- The `:class` directive accepts an object, an array, or an expression as its value. In the object form, keys represent class names, and their values determine whether the class should be added (`true`) or removed (`false`). In the array form, each element of the array represents a CSS class name.

- When the `:class` value changes, Regor will automatically update the `class` attribute of the element, reflecting the new classes in the rendered output.

- Multiple classes can be defined within the same object or array, making it convenient to manage and apply complex class conditions.

- Class names can be added or removed in response to user interactions or data changes, providing a dynamic and interactive user experience.

By using the `:class` directive in your Regor templates, you can create flexible and responsive user interfaces with the ability to toggle, add, or remove classes based on various conditions and user interactions.

[Back to the directives](directives.md)
