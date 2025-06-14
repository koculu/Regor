---
title: r-bind Directive
---

The `r-bind` directive in Regor is used to bind an element's attribute to a component's data, allowing dynamic updates. It is similar to Vue's `v-bind` directive and is a fundamental part of creating dynamic and interactive user interfaces.

## Usage

The `r-bind` directive is typically used in the following format:

```html
<element r-bind:attribute="expression"></element>
```

- `element`: The HTML element to which the attribute is bound.
- `attribute`: The name of the attribute you want to bind.
- `expression`: An expression or component data property that will be evaluated and used to update the attribute's value.

### Shorthand

You can use the shorthand notation `:` to achieve the same effect as `r-bind`. For example, the following two lines of code are equivalent:

```html
<element r-bind:attribute="expression"></element>
<element :attribute="expression"></element>
```

### Supported Flags

The `r-bind` directive supports flags that allow you to control attribute binding behavior:

- `.prop`: Use the `.prop` flag to bind to an element's property instead of its attribute. This is useful when dealing with properties that have complex behavior, such as input values.

  ```html
  <input :value.prop="inputValue" />
  ```

- `.camel`: The .camel flag allows you to use kebap-case attribute names in your expressions when actual binding occurs in a camel case property, making it stick to the HTML standards.

### Object Syntax

You can use object syntax with the `r-bind` directive to bind multiple attributes at once. This is particularly useful when binding multiple attributes to the same expression or when using dynamic attribute names.

```html
<element
  r-bind="{
  attribute1: expression1,
  attribute2: expression2,
  ...
}"
></element>
```

For example:

```html
<img
  r-bind="{
  src: imageUrl,
  alt: imageAlt,
  title: imageTitle
}"
/>
```

In the above example, multiple attributes of the `img` element are bound to corresponding component data properties using object syntax.

## Examples

### Binding an Element's `src` Attribute

In this example, we use the `r-bind` directive to bind the `src` attribute of an `img` element to a component data property `imageUrl`. When the `imageUrl` data property changes, the `src` attribute of the `img` element is updated dynamically.

```html
<img r-bind:src="imageUrl" alt="Image" />
```

### Dynamic Styling

You can use the `r-bind` directive to dynamically set the `style` attribute of an element based on component data. For example:

```html
<div r-bind:style="dynamicStyles"></div>
```

In the above example, `dynamicStyles` can be a computed property or method that returns an object with CSS style properties.

## Notes

- The `r-bind` directive is a powerful tool for creating dynamic and reactive user interfaces in Regor.

- You can use it to bind various attributes of HTML elements, including `src`, `href`, `style`, and more.

- Expressions in the `r-bind` directive are evaluated in the context of the component, allowing you to access and update component data properties.

- Changes to the bound data properties will automatically trigger updates to the associated element attributes.

- You can use `r-bind` in combination with other directives like `r-model`, `:class`, and `:style` to create complex and interactive UIs.

- Keep in mind that the `r-bind` directive is not limited to standard HTML attributes; you can also use it to bind to custom attributes in your components.

## See Also

- [r-model Directive](/directives/r-model)
- [r-text Directive](/directives/r-text)
- [r-html Directive](/directives/r-html)
- [r-on Directive](/directives/r-on)
- [r-show Directive](/directives/r-show)

[Back to the directives](/directives/)
