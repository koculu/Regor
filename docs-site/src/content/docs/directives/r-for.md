---
title: r-for Directive
---

`r-for` renders repeated template instances from arrays, iterables, and object-like values.

## Usage

```html
<li r-for="item in items">{{ item }}</li>
```

You can use `in` or `of`:

```html
<li r-for="item of items">{{ item }}</li>
```

## Index Variable

Use `#`-prefixed variable for index:

```html
<li r-for="(item, #i) in items">{{ i }} - {{ item }}</li>
```

## Iterating Over Objects

Object iteration is supported:

```html
<li r-for="(key, value) in person">{{ key }}: {{ value }}</li>
```

## Object Destructuring

Destructuring is supported:

```html
<li r-for="{ name, age }, #i in users">
  {{ i }} - {{ name }} ({{ age }})
</li>
```

## Complex Expressions

Any valid expression can provide iterable data:

```html
<ul>
  <li r-for="n in numbers.filter((n) => n > 5)">{{ n }}</li>
</ul>
```

## Keying (`key` and `:key`)

For stable identity and predictable updates, set a key on repeated nodes.

```html
<li r-for="row in rows" :key="row.id" r-text="row.name"></li>
```

Important behavior in Regor templates:

1. `key="row.id"` and `:key="row.id"` are both expression-based for list keying.
2. Nested key paths are supported, including `a.b.c.d`.
3. Use stable, unique keys from your domain model.

If keys are unstable, DOM reuse quality degrades and updates become less predictable.

## Table Templates

`r-for` supports native table structures and component-based rows/cells.

```html
<table>
  <tbody>
    <TableRow r-for="row in rows" :row="row" />
  </tbody>
</table>
```

```ts
const tableCell = createComponent(html`<td><span>{{ value }}</span></td>`, {
  props: ['value'],
})

const tableRow = createComponent(
  html`<tr>
    <TableCell :value="row.name" />
    <TableCell :value="row.age" />
  </tr>`,
  { props: ['row'] },
)
```

## Best Practices

1. Keep row templates minimal.
2. Use stable keying.
3. Avoid expensive per-row expressions in large lists.
4. Prefer pagination/windowing for very large data sets.

## See Also

1. [r-if](/directives/r-if)
2. [r-bind](/directives/r-bind)
3. [r-text](/directives/r-text)
