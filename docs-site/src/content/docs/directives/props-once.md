---
title: :props-once Directive
---

# `:props-once` Directive

The `:props-once` directive in Regor is used to bind expressions to a component's property, allowing dynamic updates. It is similar to the `r-bind` directive but specifically focuses on passing properties to components.

Here's a key distinction: While `:props` observes every term in the expression and reacts to changes anywhere along the expression chain, `:props-once` focuses solely on the tail term, making it reactive only to changes in that part of the expression.

## Usage

The `:props-once` directive has the same syntax as the `r-bind` directive, allowing you to define component properties.

```html
<MyComponent :props-once="{ title: 'My Component Title' }"></MyComponent>
```

- `MyComponent`: The registered component name.
- `title`: The name of the property you want to bind.

## Notes

- The `:props-once` directive enables binding properties not defined in component's props definition.

[Back to the directives](directives.md)
