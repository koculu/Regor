---
title: svg
---

## Overview

The `svg` function is an alias-style template tag with the same interpolation behavior as `html`, tailored for authoring SVG markup in TypeScript templates.

## Usage

```ts
import { svg } from 'regor'

const radius = 16
const icon = svg`<svg viewBox="0 0 40 40" role="img">
  <circle cx="20" cy="20" r="${radius}" />
</svg>`
```

## Parameters

- `templates` (`TemplateStringsArray`): Static segments of the template literal.
- `...args` (`unknown[]`): Interpolated values inserted between template segments.

## Return Value

- Returns a `string` containing the combined SVG markup.

## Notes

- `svg` behaves exactly like `html` at runtime (string assembly), so you can use it anywhere a template string is accepted.
- Use `svg` when you want semantic clarity in code and editor hinting for SVG snippets.

## See Also

- [html](/api/html)

[Back to the API list](/api/)
