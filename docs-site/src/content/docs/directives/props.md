---
title: :props Directive
---

The `:props` directive in Regor is used to bind expressions to a component's property, allowing dynamic updates. It is similar to the `r-bind` directive but specifically focuses on passing properties to components.

## Usage

The `:props` directive has the same syntax as the `r-bind` directive, allowing you to define component properties.

```html
<MyComponent :props="{ title: 'My Component Title' }"></MyComponent>
```

- `MyComponent`: The registered component name.
- `title`: The name of the property you want to bind.

## Notes

- The `:props` directive enables binding properties not defined in component's props definition.

[Back to the directives](/directives/)
