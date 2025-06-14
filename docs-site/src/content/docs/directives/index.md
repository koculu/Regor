---
title: Directives
sidebar:
  order: 4
---

In Regor, directives are special attributes that start with the "r-" prefix. They allow you to enhance the behavior and appearance of your applications. Below, you'll find a list of supported directives categorized by their functionality.

> **Note:** The directive prefix "r-" can be customized using `RegorConfig.getDefault().setDirectives('v-')` to align with a different naming convention, such as Vue's "v-" prefix.

**Binding Directives:**

- [`r-bind`](/directives/r-bind) Binds an element's attribute to a component's data, allowing dynamic updates.
- [`r-model`](/directives/r-model) Enables two-way data binding between form inputs.
- [`r-text`](/directives/r-text) Sets the element's text content to the result of an expression.
- [`r-html`](/directives/r-html) Renders the result of an expression as HTML content within the element.
- [`r-on`](/directives/r-on) Attaches event listeners to the element and invokes specified component methods.
- [`r-show`](/directives/r-show) Conditionally displays the element based on the truthiness of an expression.

**Control Flow Directives:**

- [`r-for`](/directives/r-for) Renders a set of elements based on an array and a template.
- [`r-if`](/directives/r-if) Conditionally renders the element based on the truthiness of an expression.
- [`r-else`](/directives/r-if) Provides an alternative rendering when used in conjunction with `r-if`.
- [`r-else-if`](/directives/r-if) Conditionally renders the element as an alternative to `r-if`.

**Utility Directives:**

- [`r-pre`](/directives/r-pre) Excludes HTML element from Regor bindings.
- [`:class`](/directives/class) Binds one or more class names to an element based on expressions.
- [`:style`](/directives/style) Binds one or more inline styles to an element based on expressions.
- [`:ref`](/directives/ref) Provides a reference to an element in the template, allowing you to interact with it programmatically.
- [`:key`](/directives/r-for) Provides a unique identifier for each item in a list, aiding efficient updates and rendering.
- [`:is`](/directives/is) Specifies the component to dynamically render based on a value or expression.
- [`r-teleport`](/directives/r-teleport): Teleports the element to anywhere in the DOM. Unlike Vue, teleport is a directive to avoid component overhead.
- [`:props`](/directives/props) Vue uses `v-bind` for component property passing. However, this can conflict with `v-bind`'s attribute fall-through logic. Hence, Regor defines a dedicated directive to pass properties using object syntax. It enables passing properties without defining them in the component's props contract.
- [`:props-once`](/directives/props-once) Similar to `:props` but it doesn't observe the entire reactive tree of the template expression. Tail reactivity still works.

**Event Handling Directives:**

- [`@`](/directives/r-on) Shorthand for `r-on` to bind event listeners.

**Attribute Binding Directives:**

- [`:`](/directives/r-bind) Shorthand for `r-bind` to bind element attributes.
- [`.`](/directives/r-bind) Shorthand for `r-bind.prop` to set properties.

These directives empower you to create dynamic and interactive user interfaces, enhancing the user experience of your Regor-powered applications. Click on each directive to view its detailed documentation, including examples and usage guidelines.

[Back to the main](/index)
