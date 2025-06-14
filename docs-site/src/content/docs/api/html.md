---
title: html
---

## Overview

The `html` function in Regor is a utility function for creating HTML strings using template literals and interpolating values into the resulting string. It is commonly used to generate HTML content dynamically within Regor components.

## Usage

### Creating HTML Strings

The `html` function takes two parameters:

- `templates` (TemplateStringsArray): An array of string literals representing the static parts of the HTML template.

- `...args` (any[]): Any number of additional arguments that will be interpolated into the template to generate the dynamic parts of the HTML.

### Example

```javascript
import { html } from 'regor'

// Create an HTML string with dynamic content
const name = 'John'
const age = 30
const htmlString = html`<p>
  Hello, my name is ${name} and I am ${age} years old.
</p>`

// The resulting HTML string:
// "<p>Hello, my name is John and I am 30 years old.</p>"
```

## Parameters

- `templates` (TemplateStringsArray): An array of string literals representing the static parts of the HTML template.

- `...args` (any[]): Any number of additional arguments that will be interpolated into the template to generate the dynamic parts of the HTML.

## Return Value

- Returns a string that represents the HTML content generated by interpolating the template literals and values provided in the `args` array.

## Notes

- The `html` function is useful for creating HTML strings with dynamic content, such as when generating HTML markup for Regor components or templates.

- It uses JavaScript's template literal syntax to define the static parts of the HTML template and interpolates values into the template using `${...}` placeholders.

- The resulting HTML string can be directly used in your Regor components or inserted into the DOM as needed.

- In Regor, this function is commonly used in conjunction with template rendering and component creation to generate HTML content.

## See Also

- [raw](/api/raw)

[Back to the API list](/api/)
