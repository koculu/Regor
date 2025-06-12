---
title: r-text Directive
---

# r-text Directive

The `r-text` directive is used to set the text content of an HTML element to the result of an expression. It allows you to dynamically update the text displayed within an element based on the evaluated value of the provided expression.

## Syntax

```html
<element r-text="expression"></element>
```

- `<element>`: The HTML element to which you want to bind the text content.
- `expression`: An expression that determines the text content to be displayed within the element.

## Usage

The `r-text` directive is particularly useful when you want to insert dynamic data or computed values into your HTML content.

### Example

```html
<div>
  <p r-text="message"></p>
</div>
```

In this example, the text content of the `<p>` element will be dynamically updated based on the value of the `message` property in your component's data. Any changes to the `message` property will automatically reflect in the displayed text.

## Notes

- The `r-text` directive updates the text content of an element and does not interpret HTML tags. Use `r-html` if you need to render HTML content.

- You can use expressions and variables in the `expression` attribute to display dynamic content. For example, you can concatenate strings, perform calculations, or reference component properties.

- The `r-text` directive is reactive, meaning that if the value of the `expression` changes, the displayed text will update accordingly in real-time.

- You can combine the `r-text` directive with other directives and HTML attributes to create complex dynamic templates.

## Example

```html
<div>
  <p r-text="greeting"></p>
</div>
```

In this example, if the `greeting` property in your component's data is initially set to "Hello, Regor!", the text displayed within the `<p>` element will be "Hello, Regor!". If you later update the `greeting` property to "Welcome to Regor!", the displayed text will automatically change to "Welcome to Regor!".

The `r-text` directive simplifies the process of updating text content within your templates, allowing you to create dynamic and responsive user interfaces with ease.

[Back to the directives](directives.md)
