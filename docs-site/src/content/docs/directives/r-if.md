---
title: r-if
---

# Conditional Rendering Directives

In Regor, conditional rendering allows you to control the visibility of elements in your templates based on the evaluation of expressions. You can conditionally render elements, provide alternatives, and create complex conditional structures using the following directives:

## `r-if` Directive

The `r-if` directive is used to conditionally render an element based on the truthiness of an expression. It allows you to control whether an element should be displayed or omitted from the rendered output.

### Usage

To use the `r-if` directive, apply it to an element in your template. The element will only be rendered if the provided expression evaluates to a truthy value.

```html
<element r-if="condition"
  >This element will be rendered if 'condition' is truthy.</element
>
```

- The element will be included in the rendered output if the `condition` is truthy.
- If `condition` is falsy, the element will not be included in the output.

### Example

```html
<div>
  <p r-if="showParagraph">This paragraph is conditionally rendered.</p>
</div>
```

In this example, the `<p>` element will only be rendered if the `showParagraph` variable is truthy.

## `r-else` Directive

The `r-else` directive provides an alternative rendering when used in conjunction with the `r-if` directive. It allows you to specify content that should be displayed when the `r-if` condition is not met.

### Usage

To use the `r-else` directive, place it immediately after an `r-if` directive. The content associated with `r-else` will be displayed if the preceding `r-if` expression evaluates to a falsy value.

```html
<element r-if="condition"
  >This element is rendered when 'condition' is truthy.</element
>
<element r-else>This element is rendered when 'condition' is falsy.</element>
```

- If `condition` is truthy, the first element is displayed.
- If `condition` is falsy, the second element (after `r-else`) is displayed.

### Example

```html
<div>
  <p r-if="isLoggedIn">Welcome, user!</p>
  <p r-else>Please log in to access the content.</p>
</div>
```

In this example, the first paragraph is displayed when the user is logged in (`isLoggedIn` is truthy), and the second paragraph is displayed when the user is not logged in.

## `r-else-if` Directive

The `r-else-if` directive allows you to conditionally render an element as an alternative to the `r-if` directive. It is often used in conjunction with `r-if` and `r-else` to create more complex conditional structures.

### Usage

To use the `r-else-if` directive, place it after an `r-if` directive or another `r-else-if` directive. The element associated with `r-else-if` will be rendered if its expression evaluates to truthy and none of the preceding conditions (including `r-if` conditions) are met.

```html
<element r-if="condition1"
  >This element is rendered if 'condition1' is truthy.</element
>
<element r-else-if="condition2"
  >This element is rendered if 'condition2' is truthy.</element
>
<element r-else
  >This element is rendered if no previous conditions are met.</element
>
```

- The first element is displayed if `condition1` is truthy.
- If `condition1` is falsy, the second element (after `r-else-if`) is checked.
- If `condition2` is truthy, the second element is displayed.
- If neither `condition1` nor `condition2` is truthy, the third element (after `r-else`) is displayed.

### Example

```html
<div>
  <p r-if="isPremiumUser">Welcome, premium user!</p>
  <p r-else-if="isRegularUser">Welcome, regular user!</p>
  <p r-else>Please log in to access the content.</p>
</div>
```

In this example, different greetings are displayed based on the user's role. The first paragraph is displayed for premium users, the second for regular users, and the third for non-logged-in users.

## Notes

- You can create complex conditional structures by combining `r-if`, `r-else`, and `r-else-if` directives within your templates.
- Elements with `r-if`, `r-else`, or `r-else-if` directives can include child elements, and their visibility is also controlled by these directives.

Conditional rendering directives in Regor empower you to create dynamic and context-aware user interfaces, improving the user experience of your applications.

[Back to the directives](directives.md)
