---
title: Templates and Expressions
sidebar:
  order: 20
---

This page describes how Regor turns templates into live bindings, and what expression syntax is supported in runtime.

## Template Sources

Regor accepts templates from multiple sources in `createApp(...)` / `createComponent(...)`:

1. HTML string (`template`)
2. Existing DOM element (`element`)
3. DOM selector (`selector`)
4. JSON template (`json`)

String templates are preprocessed before DOM parsing (table compatibility rules below).

## Interpolation

Regor supports two interpolation delimiters:

1. `{{ expr }}`
2. `[[ expr ]]`

```html
<p>{{ user.name }}</p>
<p>[[ user.name ]]</p>
```

## Interpolation Transform Rules

When interpolation is enabled (`RegorConfig.useInterpolation = true`):

1. Interpolation in text nodes is converted to directive bindings before normal bind phase.
2. If an element contains exactly one interpolation token with only surrounding whitespace, Regor rewrites that element to use `r-text`.
3. Mixed text + interpolation is split into text nodes and generated `<span r-text="...">` nodes.
4. Subtrees marked with `r-pre` are skipped.

If `useInterpolation = false`, `{{ ... }}` and `[[ ... ]]` stay as plain text.

## Table-Safe Preprocess for String Templates

For string templates, Regor preprocesses markup to keep table structures valid:

1. Outside table scope:
   - `<tr>` / `<td>` / `<th>` may be rewritten to alias hosts (`trx` / `tdx` / `thx`) with `is="r-*"` markers.
2. In table-sensitive positions:
   - non-native direct children may be rewritten to safe hosts with `is="regor:OriginalTag"`.
3. Self-closing custom tags under row context are normalized to explicit open/close tags.

This avoids browser table parser dropping/reparenting custom nodes.

## Where Expressions Are Used

Typical expression points:

1. Text/content: `r-text`, interpolation
2. Attributes/properties: `:x`, `.x`, `r-bind:x`
3. Events: `@click`, `r-on:*`
4. Control flow: `r-if`, `r-else-if`, `r-for`
5. Styling: `:class`, `:style`
6. Components: `:is`, `:context`, `r-context`

## Expression Scope and Resolution

Expressions are evaluated against active context stack:

1. Current app/component context
2. Loop aliases (`r-for`)
3. Slot switch contexts (when `head.enableSwitch = true`)
4. Global context from `RegorConfig`

Special identifiers:

1. `$root`: root-most context
2. `$parent`: immediate parent context
3. `$ctx`: full context stack array
4. `this`: current context object
5. `$event`: available in event/lazy evaluation paths

Regor auto-unrefs refs in expressions, so template code uses `user.name`, not `user.name()` / `.value`.

## Supported Expression Syntax (Runtime)

Backed by Regor’s jsep/regorEval pipeline, templates support:

1. Member access, optional chaining: `a.b`, `a?.b`, `a[k]`
2. Calls/new: `fn(x)`, `new Date(0)`
3. Arithmetic/comparison/logical/bitwise operators
4. Nullish coalescing / ternary: `a ?? b`, `ok ? a : b`
5. Assignments and updates: `x = 1`, `x += 2`, `x++`, `--x`
6. Arrays/objects/spread/computed object keys
7. Arrow functions
8. Template literals and tagged templates
9. Regex literals
10. Comma/compound forms

## `r-for` Key Notes

Both forms are supported for expression-based keys:

1. `key="row.id"`
2. `:key="row.id"`

Nested paths such as `a.b.c.d` are supported.
Use stable domain IDs for predictable updates.

## Practical Patterns

1. Prefer `r-text` for hot repeated rows.
2. Keep template expressions lightweight; move heavy logic into methods/computed refs.
3. Use stable keys in lists.
4. Use `r-pre` to protect literal template snippets from interpolation transform.

## Advanced Samples

### 1) Static-first page + dynamic island

Use existing server-rendered markup and bind only the dynamic area.

```html
<header>
  <h1>My Shop</h1>
  <div id="auth-island">
    <button @click="toggle">{{ loggedIn ? 'Logout' : 'Login' }}</button>
    <span r-show="loggedIn">Welcome, {{ userName }}</span>
  </div>
</header>
```

```ts
createApp(
  {
    loggedIn: ref(false),
    userName: ref('Ada'),
    toggle() {
      this.loggedIn(!this.loggedIn())
    },
  },
  { selector: '#auth-island' },
)
```

### 2) Large list with stable keys and cheap row expressions

```html
<ul>
  <li r-for="row, #i in rows" :key="row.id">
    <strong r-text="row.title"></strong>
    <span>#{{ i }}</span>
    <small r-text="row.status"></small>
  </li>
</ul>
```

Pattern:

1. `:key="row.id"` for stable identity.
2. Keep row expressions simple (`r-text` + direct paths).
3. Avoid heavy object construction inside row template expressions.

### 3) Dynamic component template switching (`:is`)

```html
<section :is="currentView" :context="{ item: selectedItem }"></section>
```

```ts
createApp({
  currentView: ref('UserView'),
  selectedItem: ref({ id: 1, name: 'Ada' }),
  components: { UserView, AuditView },
})
```

Use this when one region must swap templates/components based on state, while keeping parent bindings simple.

### 4) Slot template evaluated in parent context

```ts
const Shell = createComponent('<section><slot></slot></section>', {
  context: (head) => {
    head.enableSwitch = true
    return {}
  },
})
```

```html
<Shell>
  <p>{{ parentMessage }}</p>
</Shell>
```

With `head.enableSwitch = true`, slot expressions can resolve against parent context naturally.

### 5) Interpolation-off region for literal template text

```ts
const cfg = new RegorConfig()
cfg.useInterpolation = false
createApp(
  { msg: ref('x') },
  { element: root, template: '<pre>{{ msg }}</pre>' },
  cfg,
)
```

or local skip:

```html
<pre r-pre>
  {{ this stays literal }}
</pre>
```

Use these when docs/snippets must display `{{ ... }}` without binding.

## See Also

1. [Directives](/directives)
2. [Reactivity](/guide/reactivity)
3. [Components](/guide/components)
4. [r-for](/directives/r-for)
