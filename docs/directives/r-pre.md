# r-pre Directive

The `r-pre` directive is a utility directive in Regor that allows you to exclude specific HTML elements from Regor's data binding and templating. This directive is useful when you want to preserve certain parts of your HTML markup as static content that should not be subject to data binding or dynamic updates.

## Syntax

```html
<element r-pre></element>
```

- `<element>`: The HTML element to which you want to apply the `r-pre` directive.

## Usage

The `r-pre` directive is straightforward to use. You simply apply it to an HTML element that you want to mark as "pre-rendered" or "static," meaning its content won't be processed by Regor for data binding or template rendering.

### Example

Consider the following example:

```html
<div>
  <p>This is a dynamic text: {{ dynamicText }}</p>
  <div r-pre>
    <p>This content is pre-rendered and won't be updated: {{ staticText }}</p>
  </div>
</div>
```

In this example, the `<div>` element with the `r-pre` directive contains static content enclosed within `<p>` tags. The `dynamicText` variable inside the dynamic portion of the template will be evaluated and updated based on your component's data changes. However, the content inside the `r-pre` directive, including `staticText`, will remain unchanged, preserving its original state.

## Use Cases

The `r-pre` directive is helpful in various scenarios, including:

1. **Preserving Unprocessed Content**: You might have sections of your HTML that should remain exactly as written, without any Regor data binding or template rendering. In such cases, you can wrap those sections with the `r-pre` directive.

2. **Preventing Double Processing**: If your HTML contains dynamic data that you want to use in JavaScript code but don't want Regor to process it for data binding or rendering, you can use `r-pre` to avoid double processing.

3. **Embedding Third-Party Widgets**: When embedding third-party widgets or components that rely on their own JavaScript, applying `r-pre` ensures that Regor doesn't interfere with the widget's functionality.

## Notes

- Elements marked with `r-pre` will not participate in data binding or template rendering. Therefore, any expressions or variables within those elements will not be evaluated or updated by Regor.

- The `r-pre` directive is especially useful when you need to integrate Regor into an existing project or when working with complex HTML structures that require fine-grained control over data binding.

By using the `r-pre` directive in your Regor templates, you can effectively manage which parts of your HTML are subject to data binding and dynamic updates and which parts remain static and unaltered. This flexibility allows you to create dynamic and interactive user interfaces while preserving the integrity of your existing HTML content.

[Back to the directives](directives.md)
