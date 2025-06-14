---
title: :is Directive
---


The `:is` directive in Regor allows you to dynamically render components based on a value or expression. It provides a way to conditionally choose which component to render in a template, enabling you to create dynamic and flexible user interfaces.

## Syntax

```html
<component :is="componentName"></component>
```

- `<component>`: The HTML element where you want to render the dynamic component.
- `componentName`: A variable, expression, or component name that specifies the component to render dynamically.

## Usage

The `:is` directive is used for dynamic component rendering. It allows you to switch between different components based on a condition or variable value. This is particularly useful when you have multiple components that serve a similar purpose, and you want to determine which one to render based on user interactions or data.

### Example

Here's an example of using the `:is` directive to render different components dynamically:

```html
<template>
  <div>
    <button @click="showComponentA = !showComponentA">Toggle Component</button>
    <component :is="currentComponent"></component>
  </div>
</template>
```

```ts
import { createApp, computed, ref } from 'regor'
import { componentA, componentB } from 'components'

const showComponentA = ref(true)
const currentComponent = computed(() =>
  showComponentA ? componentA : componentB,
)
createApp({
  components: {
    componentA,
    componentB,
  },
  currentComponent,
  showComponentA,
})
```

In this example, the `:is` directive is used to render either `ComponentA` or `ComponentB` dynamically based on the value of the `currentComponent` data property. When the "Toggle Component" button is clicked, it switches between the two components.

## Use Cases

The `:is` directive is valuable in several scenarios:

1. **Conditional Rendering**: You can use `:is` to conditionally render components based on user interactions, data changes, or other dynamic conditions.

2. **Tabbed Interfaces**: When building tabbed interfaces or wizard-like components, you can use `:is` to switch between different steps or tabs, rendering only the active step.

3. **Dynamic Forms**: In forms with varying input requirements, you can use `:is` to display different input components dynamically based on user selections.

4. **Component-Based Routing**: When working with component-based routing libraries, you can use `:is` to render components based on the current route.

## Notes

- The `:is` directive expects a component name or variable that represents the component to render. This can be a reference to a component or a dynamically determined component name.

- When the `:is` directive's value changes, Regor will automatically update the rendered component to match the new value.

- The `:is` directive is a powerful tool for creating dynamic and responsive user interfaces, enabling you to build complex UIs that adapt to various user interactions and scenarios.

By using the `:is` directive in your Regor templates, you can take advantage of dynamic component rendering to create versatile and interactive web applications.

[Back to the directives](directives.md)
