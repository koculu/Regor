---
title: toJsonTemplate
---


## Overview

The `toJsonTemplate` function is used to convert an HTML element or an array of HTML elements into a JSON structure. This can be useful for:

- Rendering HTML content in strict content security policy (CSP) pages.
- Improving rendering performance.

## Usage

### Converting an HTML Element to JSON

To convert an HTML element to a JSON structure, call the `toJsonTemplate` function with the HTML element as the parameter. The function will return a JSON object that represents the structure of the HTML element.

### Converting an Array of HTML Elements to JSON

You can also use the `toJsonTemplate` function to convert an array of HTML elements into an array of JSON structures. This is useful when you have multiple HTML elements that you want to convert to JSON.

### Example

```javascript
import { toJsonTemplate } from 'regor'

// Convert an HTML element to JSON
const element = document.querySelector('#myElement')
const jsonTemplate = toJsonTemplate(element)

// Convert an array of HTML elements to JSON
const elements = document.querySelectorAll('.myElements')
const jsonTemplates = toJsonTemplate(Array.from(elements))
```

## Parameters

- `node`: The HTML element or an array of HTML elements to be converted to JSON. It can be a single `Element` or an array of `Element` objects.

## Return Value

The `toJsonTemplate` function returns a JSON structure that represents the HTML element(s) passed as the parameter. The structure contains the following properties:

- `t` (string): The tag name of the HTML element. This property is present if the HTML element has a tag name (e.g., "div", "p").

- `a` (object): An object representing the attributes of the HTML element. Each attribute is a key-value pair in the object.

- `c` (array): An array of JSON structures representing the child elements of the HTML element. Each child element is converted to a JSON structure and added to this array.

- `d` (string): The text node content of the HTML element. This property is present if the HTML element contains text content.

- `n` (number): The node type of the HTML element, specifically for comment nodes. This property is present if the HTML element is a comment node.

## Notes

- The `toJsonTemplate` function can handle both single HTML elements and arrays of HTML elements. When converting an array, it returns an array of JSON structures.

- The resulting JSON structure can be used to render HTML content in strict content security policy (CSP) pages or to improve rendering performance.

- This function is useful when you need to serialize HTML content to JSON or when you want to analyze the structure of HTML elements programmatically.

- The JSON structure closely follows the structure of the HTML elements, including attributes, child elements, and text content.

## See Also

- [`toFragment`](../toFragment.md)
- [`createApp`](../createApp.md)
- [`createComponent`](../createComponent.md)

[Back to the API list](../regor-api.md)
