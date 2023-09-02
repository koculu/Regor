# `r-teleport` Directive

The `r-teleport` directive in Regor is a straightforward directive that empowers you to move an element anywhere within your document's DOM structure. This can be especially useful when you need to dynamically relocate elements to different parts of your web page.

## Usage

To utilize the `r-teleport` directive, follow this basic syntax:

```html
<element r-teleport="targetSelector"></element>
```

- `element`: The HTML element you wish to teleport/move.
- `targetSelector`: A selector indicating the destination where you want to place the element.

## Example

Here's an example of how you can employ the `r-teleport` directive:

```html
<!-- Move the element with the 'my-element' ID to the element with the 'destination' ID -->
<div r-teleport="#destination">
  <div id="my-element">This element will be teleported.</div>
</div>
```

In this example, the content inside the `<div>` with the ID "my-element" is moved to the element with the ID "destination" using the `r-teleport` directive.

## Notes

- The `r-teleport` directive allows you to dynamically reposition elements within the DOM structure, enhancing flexibility and interactivity in your web applications.

- It works by selecting a target element based on a CSS selector (`targetSelector`) and moving the element to that location in the document.

- This directive can be particularly handy for creating dynamic UIs and interactive web pages.

- You can use this directive in combination with other Regor directives and features to create rich and dynamic web applications.

## See Also

- [r-bind Directive](r-bind.md)
- [r-model Directive](r-model.md)
- [r-text Directive](r-text.md)
- [r-html Directive](r-html.md)
- [r-on Directive](r-on.md)
- [r-show Directive](r-show.md)

[Back to the directives](directives.md)
