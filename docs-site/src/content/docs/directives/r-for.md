---
title: r-for Directive
---

# `r-for` Directive

The `r-for` directive is a powerful tool in Regor that allows you to iterate over an array or iterable and generate repetitive elements based on a template. It enables you to efficiently render lists of items and is especially useful for creating dynamic content in your templates.

## Usage

To use the `r-for` directive, apply it to an element in your template, followed by an expression that represents the data you want to iterate over. The directive creates a template that is duplicated for each item in the iterable, providing a way to render dynamic content.

```html
<element r-for="item in items">
  <!-- 'item' represents the current item -->
  <!-- Content to be repeated for each item -->
  {{ item }}
</element>
```

- `item`: Represents the current item in the iteration.
- `items`: An array or iterable from which items are taken for rendering.

### Example

```html
<ul>
  <li r-for="fruit in fruits">{{ fruit }}</li>
</ul>
```

In this example, the `r-for` directive iterates over the `fruits` array and generates an `<li>` element for each fruit, displaying the fruit's name.

## Index Variable

You can also access the index of the current iteration using the `#` character in front of any variable, which is commonly used when you need to track the position of each item in the iterable.

`#` prefix enables accessing to individual indexes in nested `r-for` loops.

```html
<element r-for="(item, #index) in items">
  <!-- 'item' and 'index' variables -->
  <!-- Content to be repeated for each item -->
  {{ index + 1 }}. {{ item }}
</element>
```

- `item`: Represents the current item in the iteration.
- `#index`: Represents the index of the current item (zero-based).
- `items`: An array or iterable from which items are taken for rendering.

### Example

```html
<ul>
  <li r-for="(fruit, #index) in fruits">{{ index + 1 }}. {{ fruit }}</li>
</ul>
```

In this example, the `r-for` directive generates a numbered list of fruits, displaying both the index and the fruit name.

## Iterating Over Objects

You can use the `r-for` directive to iterate over the properties of an object.

```html
<element r-for="(key, value) in object">
  <!-- 'key' and 'value' variables -->
  <!-- Content to be repeated for each property -->
  {{ key }}: {{ value }}
</element>
```

- `key`: Represents the current property's key (name).
- `value`: Represents the current property's value.
- `object`: An object whose properties are iterated over.

### Example

```html
<ul>
  <li r-for="(key, value) in person">{{ key }}: {{ value }}</li>
</ul>
```

In this example, the `r-for` directive iterates over the properties of the `person` object and displays each property's key-value pair.

## Object Destructuring

You can use object destructuring to extract specific properties from the items in the iterable when using the r-for directive. This allows you to access and display only the properties you need within the repeated content.

```html
<element r-for="{ property1, property2 }, #index in items">
  <!-- 'property1', 'property2', and 'index' variables -->
  <!-- Content to be repeated for each item -->
  {{ property1 }} - {{ property2 }} (Index: {{ index }})
</element>
```

- `{ property1, property2 }`: Specifies the properties to be extracted from each item in the iterable.
- `#index`: Represents the index of the current item (zero-based).
- `items`: An array or iterable from which items are taken for rendering.

### Example

```html
<ul>
  <li r-for="{ name, age }, #index in users">
    {{ name }} (Age: {{ age }}, Index: {{ #index }})
  </li>
</ul>
```

In this example, the `r-for` directive iterates over the `users` array and extracts the `name` and `age` properties from each user object. It then displays both the `name`, `age`, and the `index` of each user.

Object destructuring provides fine-grained control over which properties are utilized within the repeated content, enhancing flexibility and readability in your templates.

## Iterating with `of` and `in`

You can use either `of` or `in` to specify the iteration variable and the iterable, depending on your preference. Both are equivalent in functionality.

```html
<element r-for="fruit of fruits">
  <!-- Using 'of' -->
  <!-- Content to be repeated for each item -->
  {{ fruit }}
</element>
```

## Key Attribute

When iterating over lists of items, it's important to provide a unique `key` attribute to help Regor efficiently track and update elements. The `key` attribute should be applied to the repeated element, and its value should be unique for each item in the iterable.

```html
<ul>
  <li r-for="(user, #index) in fruits" :key="id">{{ user }}</li>
</ul>
```

In this example, the `:key` attribute is set to `id`, ensuring that each `<li>` element has a unique identifier based on user's id.

## Notes

- The `r-for` directive is a powerful tool for rendering dynamic lists and iterables.
- You can use `#` prefix to access the current iteration's index.

The `r-for` directive in Regor simplifies the process of rendering dynamic lists of items, making your templates more flexible and data-driven.

[Back to the directives](directives.md)
