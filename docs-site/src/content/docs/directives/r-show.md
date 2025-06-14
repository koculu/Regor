---
title: r-show Directive
---


The `r-show` directive is used to conditionally display or hide an HTML element based on the truthiness of an expression. It allows you to control the visibility of an element dynamically.

## Syntax

```html
<element r-show="expression"></element>
```

- `<element>`: The HTML element that you want to conditionally show or hide.
- `expression`: An expression that evaluates to a boolean value (`true` or `false`). If the expression is `true`, the element is displayed; if it's `false`, the element is hidden.

## Usage

The `r-show` directive is useful when you want to toggle the visibility of an element based on a condition in your Regor component. It provides a simple way to hide or reveal content in response to user interactions or changes in your application's state.

### Example

```html
<div>
  <p r-show="isContentVisible">
    This content is visible when 'isContentVisible' is true.
  </p>
</div>
```

In this example, the `<p>` element will be displayed if the `isContentVisible` property in your component's data is `true`. If `isContentVisible` becomes `false`, the element will be hidden.

## Notes

- The `r-show` directive operates by toggling the element's `display` CSS property. When the expression evaluates to `true`, the `display` property is set to its default value (usually `"block"` or `"inline"`), making the element visible. When the expression evaluates to `false`, the `display` property is set to `"none"`, hiding the element.

- You can use expressions that evaluate to boolean values in the `r-show` directive. These expressions can be based on component data, computed properties, or any logic you implement in your component.

- The `r-show` directive is reactive, meaning that changes to the expression's truthiness will automatically update the element's visibility. If the expression becomes `true`, the element will become visible, and if it becomes `false`, the element will be hidden.

- You can combine the `r-show` directive with other directives and HTML attributes to create complex conditional rendering logic in your Regor templates.

## Example

```html
<div>
  <button @click="toggleVisibility">Toggle Visibility</button>
  <p r-show="isVisible">This content can be toggled on and off.</p>
</div>
```

In this example, clicking the "Toggle Visibility" button will trigger the `toggleVisibility` method in your component. This method updates the `isVisible` property. If `isVisible` is `true`, the `<p>` element will be displayed; if it's `false`, the element will be hidden. This allows you to create interactive user interfaces with elements that appear and disappear based on user actions.

The `r-show` directive provides a straightforward way to implement conditional visibility in your Regor-powered applications, making it easier to control what content is displayed to users in response to various conditions and interactions.

[Back to the directives](/directives/directives)
