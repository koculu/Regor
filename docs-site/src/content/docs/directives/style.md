---
title: :style Directive
---

The `:style` directive in Regor allows you to dynamically apply inline styles to HTML elements. It provides a way to bind and update the `style` attribute of an element based on data or expressions. With `:style`, you can create dynamic and responsive styling for your components.

## Syntax

```html
<element :style="styleObject"></element>
```

- `<element>`: The HTML element to which you want to apply inline styles.
- `styleObject`: An object or expression that defines the inline styles to be applied. The object's keys represent style properties (in camelCase or hyphenated), and their values specify the corresponding style values.

## Usage

The `:style` directive is used to dynamically apply styles to HTML elements based on data or expressions. It's a powerful tool for creating interactive and responsive UIs by altering the appearance of elements based on user interactions, data changes, or other dynamic conditions.

### Example

Here's an example of using the `:style` directive to dynamically change the background color of a `div` element based on user interaction:

```html
<div>
  <button @click="changeColor">Change Color</button>
  <div :style="dynamicStyles"></div>
</div>
```

```ts
import { createApp, ref } from 'regor'

createApp({
  dynamicStyles: ref({
    backgroundColor: 'red',
    width: '100px',
    height: '100px',
  }),
  isRed: true,
  changeColor() {
    this.isRed = !this.isRed
    this.dynamicStyles().backgroundColor.value = this.isRed ? 'red' : 'blue'
  },
})
```

In this example, the `:style` directive binds the `style` attribute of the `div` element to the `dynamicStyles` data object. When the "Change Color" button is clicked, the background color of the `div` toggles between red and blue, illustrating how you can dynamically update styles.

## Use Cases

The `:style` directive is useful in various scenarios:

1. **Dynamic Styling**: You can use `:style` to dynamically change the style of an element in response to user actions or data changes. This is commonly used for dynamic theming, highlighting, or toggling styles.

2. **Conditional Styling**: By binding the `:style` directive to an object that contains style properties, you can conditionally apply styles based on certain conditions or flags in your application's state.

3. **Responsive Design**: `:style` can be used to create responsive layouts by adjusting element dimensions, margins, or padding based on screen size or other factors.

4. **Animation and Transitions**: It's often paired with animation libraries to animate elements by changing their styles over time.

## Notes

- The `:style` directive accepts an object as its value, where keys represent style properties (in camelCase or hyphenated) and values specify the corresponding style values. You can also use expressions to compute style values dynamically.

- When the `:style` value changes, Regor will automatically update the inline styles of the element, reflecting the new styles in the rendered output.

- Multiple style properties can be defined within the same object, making it convenient to manage and apply complex styles.

- Style properties can be added or modified in response to user interactions or data changes, providing a dynamic and interactive user experience.

By using the `:style` directive in your Regor templates, you can create flexible and responsive user interfaces with the ability to adapt and change styles based on various conditions and user interactions.

[Back to the directives](/directives/)
