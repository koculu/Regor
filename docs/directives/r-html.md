# r-html Directive

The `r-html` directive is used to render HTML content within an HTML element based on the result of an expression. It allows you to dynamically insert and update HTML markup inside an element.

## Syntax

```html
<element r-html="expression"></element>
```

- `<element>`: The HTML element to which you want to bind the HTML content.
- `expression`: An expression that generates HTML content to be rendered within the element.

## Usage

The `r-html` directive is particularly useful when you need to display content with HTML markup or when you want to render dynamic HTML templates.

### Example

```html
<div>
  <p r-html="dynamicHtml"></p>
</div>
```

In this example, the HTML content inside the `<p>` element will be dynamically updated based on the value of the `dynamicHtml` property in your component's data. Any changes to the `dynamicHtml` property will automatically reflect in the rendered HTML content.

## Notes

- The `r-html` directive renders HTML content, including tags and elements. Be cautious when using this directive with user-generated or untrusted content to prevent security vulnerabilities like Cross-Site Scripting (XSS) attacks.

- You can use expressions and variables in the `expression` attribute to generate dynamic HTML content. This allows you to create complex templates that adapt to changing data.

- The `r-html` directive is reactive, meaning that if the value of the `expression` changes, the rendered HTML content will update accordingly in real-time.

- You can combine the `r-html` directive with other directives and HTML attributes to create dynamic and interactive user interfaces.

## Example

```html
<div>
  <p r-html="dynamicHtmlContent"></p>
</div>
```

In this example, if the `dynamicHtmlContent` property in your component's data is initially set to `<strong>Hello, Regor!</strong>`, the `<p>` element will render the text "Hello, Regor!" in bold. If you later update the `dynamicHtmlContent` property to `<em>Welcome to <strong>Regor</strong>!</em>`, the rendered HTML content will change to display "Welcome to Regor!" in italics with "Regor" in bold.

The `r-html` directive empowers you to create dynamic and interactive user interfaces that incorporate rich HTML content, making your Regor-powered applications more versatile and engaging.

[Back to the directives](directives.md)
