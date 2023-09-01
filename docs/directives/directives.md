# Supported Directives

In Regor, directives are special attributes that start with the "r-" prefix. They allow you to enhance the behavior and appearance of your applications. Below, you'll find a list of supported directives categorized by their functionality.

> **Note:** The directive prefix "r-" can be customized using `RegorConfig.getDefault().setDirectives('v-')` to align with a different naming convention, such as Vue's "v-" prefix.

**Binding Directives:**

- [`r-bind`](r-bind.md) Binds an element's attribute to a component's data, allowing dynamic updates.
- [`r-model`](r-model.md) Enables two-way data binding between form inputs.
- [`r-text`](r-text.md) Sets the element's text content to the result of an expression.
- [`r-html`](r-html.md) Renders the result of an expression as HTML content within the element.
- [`r-on`](r-on.md) Attaches event listeners to the element and invokes specified component methods.
- [`r-show`](r-show.md) Conditionally displays the element based on the truthiness of an expression.

**Control Flow Directives:**

- [`r-for`](r-for.md) Renders a set of elements based on an array and a template.
- [`r-if`](r-if.md) Conditionally renders the element based on the truthiness of an expression.
- [`r-else`](r-else.md) Provides an alternative rendering when used in conjunction with `r-if`.
- [`r-else-if`](r-else-if.md) Conditionally renders the element as an alternative to `r-if`.

**Utility Directives:**

- [`r-pre`](r-pre.md) Excludes HTML element from Regor bindings.
- [`:class`](class.md) Binds one or more class names to an element based on expressions.
- [`:style`](style.md) Binds one or more inline styles to an element based on expressions.
- [`:ref`](ref.md) Provides a reference to an element in the template, allowing you to interact with it programmatically.
- [`:key`](key.md) Provides a unique identifier for each item in a list, aiding efficient updates and rendering.
- [`:is`](is.md) Specifies the component to dynamically render based on a value or expression.
- [`r-teleport`](r-teleport.md): Teleports the element to anywhere in the DOM. Unlike Vue, teleport is a directive to avoid component overhead.
- [`:props`](props.md) Vue uses `v-bind` for component property passing. However, this can conflict with `v-bind`'s attribute fall-through logic. Hence, Regor defines a dedicated directive to pass properties using object syntax. It enables passing properties without defining them in the component's props contract.
- [`:props-once`](props-once.md) Similar to `:props` but it doesn't observe the entire reactive tree of the template expression. Tail reactivity still works.

**Event Handling Directives:**

- [`@`](at.md) Shorthand for `r-on` to bind event listeners.

**Attribute Binding Directives:**

- [`:`](colon.md) Shorthand for `r-bind` to bind element attributes.
- [`.`](dot.md) Shorthand for `r-bind.prop` to set properties.

These directives empower you to create dynamic and interactive user interfaces, enhancing the user experience of your Regor-powered applications. Click on each directive to view its detailed documentation, including examples and usage guidelines.

[Back to the main](../index.md)
