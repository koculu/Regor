---
title: toFragment
---

# `toFragment`

## Overview

The `toFragment` function is used to convert a JSON template, representing HTML or SVG elements, into a DocumentFragment. This can be particularly useful when you want to create a lightweight, in-memory representation of the DOM structure for further manipulation or rendering.

## Usage

### Converting a JSON Template to a DocumentFragment

To convert a JSON template to a DocumentFragment, call the `toFragment` function with the JSON template as the parameter. The function will return a DocumentFragment containing the converted elements.

### Example

```javascript
import { toFragment } from 'regor'

// Define a JSON template representing HTML elements
const jsonTemplate = {
  t: 'div',
  a: { class: 'container' },
  c: [
    {
      t: 'h1',
      a: { class: 'title' },
      d: 'Hello, Regor!',
    },
    {
      t: 'p',
      d: 'Regor is awesome.',
    },
  ],
}

// Convert the JSON template to a DocumentFragment
const fragment = toFragment(jsonTemplate)

// Append the DocumentFragment to the DOM
const targetElement = document.getElementById('app')
targetElement.appendChild(fragment)
```

## Parameters

- `json`: The JSON template to be converted into a DocumentFragment. It can represent one or more HTML or SVG elements. If an array of JSON templates is provided, each template will be converted, and their resulting elements will be added to the DocumentFragment.

- `isSVG` (optional): A boolean flag indicating whether the elements in the JSON template should be treated as SVG elements. If set to `true`, SVG-specific elements and attributes will be correctly created. Default is `false`.

- `config` (optional): An instance of `RegorConfig` that defines configuration options for Regor. This can be used to specify custom attribute handling and other options. If not provided, the default `RegorConfig` will be used.

## Return Value

The `toFragment` function returns a `DocumentFragment` containing the elements created from the provided JSON template(s).

## Notes

- The `toFragment` function is useful for creating DocumentFragments that can be used for lightweight rendering and manipulation of DOM structures.

- It can handle both HTML and SVG elements in the JSON template, depending on the `isSVG` flag.

- The resulting `DocumentFragment` can be appended to the DOM or further manipulated using standard DOM methods.

- Ensure that the JSON template follows the expected structure with tag names (`t`), attributes (`a`), children (`c`), and text content (`d`) as specified in the parameter descriptions.

- Custom attribute handling and other options can be configured using the `config` parameter.

## See Also

- [`toJsonTemplate`](toJsonTemplate.md)
- [`createApp`](createApp.md)
- [`createComponent`](createComponent.md)

[Back to the API list](regor-api.md)
