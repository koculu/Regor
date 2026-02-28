![img](https://raw.githubusercontent.com/koculu/regor/main/docs/images/logo1.png)

# Regor

Regor is a runtime-first UI framework for teams that want direct DOM control, strong TypeScript ergonomics, and precise reactivity behavior without being forced into a Virtual DOM architecture.

Its template syntax is familiar to Vue users (`r-if`, `r-model`, `r-for`, `r-bind`), but its runtime model is intentionally different: Regor is built for progressive enhancement, mixed-rendering environments, and incremental adoption.

### [![Published on npm](https://img.shields.io/npm/v/regor.svg)](https://www.npmjs.com/package/regor)

[**`Try Regor Online`**](https://stackblitz.com/edit/regor-sample-1?file=index.ts)

## Key Features

- **No VDOM Layer:** Bind directly to real DOM for transparent runtime behavior and straightforward debugging.
- **TypeScript-Native:** Use standard TypeScript interfaces, classes, and generics without framework-specific file formats.
- **No Build Step Required:** Define components in TypeScript using tagged string templates with npm, CDN ESM, or global build workflows.
- **Secure Evaluation:** Regor's secure JavaScript VM ensures safe runtime compilation. You can enable security policy in your page without removing runtime compilation support.

```html
<meta
  http-equiv="Content-Security-Policy"
  content="require-trusted-types-for 'script';"
/>
```

- **Flexible Reactivity:** Combine `ref`, `sref`, `batch`, `pause`, `resume`, and `entangle` for explicit state orchestration.
- **Static-First + Islands:** Bind to existing DOM without removing server-rendered HTML, ideal for progressive enhancement.
- **Reentrance:** Mount multiple times in already-mounted regions with same or different app contexts.
- **Compatibility:** Rendered pages are designed for seamless integration with other libraries manipulating the DOM.

## Documentation

Discover the capabilities of Regor by diving into our comprehensive documentation. Whether you're new to Regor or an experienced user, our documentation provides in-depth insights into its features, API, directives, and more.

Start exploring the [Regor Documentation](https://tenray.io//regor) now to harness the full potential of this powerful UI framework. The documentation sources are located in [docs-site](docs-site/).

## Requirements

Regor is developed using Node.js 18 and Yarn. Ensure you have Node.js 18 or newer installed before running the examples or the documentation site.

## Getting started

Click and count sample source:

```ts
import { createApp, ref } from 'regor'

createApp({
  count: ref(0),
})
```

HTML:

```html
<div id="app">
  <button @click="count++">Count is: {{ count }}</button>
</div>
```

Defining component:

```ts
import { createApp, defineComponent, ref, html, type Ref } from 'regor'

interface MyComponent {
  message: Ref<string>
}

const template = html`<button @click="count++">
  {{ message }} {{ count }}
</button>`

const props = ['message']

const myComponent = defineComponent<MyComponent>(template, {
  context: (head) => ({
    message: head.props.message,
    count: ref(0),
  }),
  props,
})

createApp({
  components: { myComponent },
  message: ref('Count is:'),
})
```

HTML:

```html
<div id="app">
  <MyComponent :message="message"></MyComponent>
  <my-component :message="message"></my-component>
</div>
```

## Table Templates and Components

Regor preprocesses table-related templates to keep markup valid when using
components in table structures.

- Supported table containers: `table`, `thead`, `tbody`, `tfoot`.
- Component tags directly under row containers are normalized to valid hosts.
- Component tags directly under `<tr>` are normalized to `<td>` hosts (except
  native `<td>` / `<th>`).
- Regor preserves valid table markup while supporting component-based rows and
  cells in table templates.

Example:

```html
<table>
  <tbody>
    <TableRow r-for="row in rows" :row="row" />
  </tbody>
</table>
```

```ts
const tableRow = defineComponent(
  html`<tr>
    <TableCell :value="row.name" />
    <TableCell :value="row.age" />
  </tr>`,
  { props: ['row'] },
)
```

Define composables:

```ts
import { ref, onMounted, onUnmounted, type Ref } from 'regor'

export const useMouse = (): { x: Ref<number>; y: Ref<number> } => {
  const x = ref(0)
  const y = ref(0)

  const update = (event: MouseEvent): void => {
    x(event.pageX)
    y(event.pageY)
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}
```

## Installation

`yarn add regor`

or

`npm install regor`

## Comparison with VueJs

Regor is openly inspired by Vue’s concepts (even adopting a similar directive syntax like r-if / r-model instead of v-if / v-model), but it fundamentally diverges in its implementation. It prioritizes runtime flexibility, build-less environments, and strict TypeScript integration over the Virtual DOM (VDOM) paradigm.

### Architecture and rendering model

- **Vue:** Uses a Virtual DOM. This provides excellent performance for highly dynamic Single Page Applications (SPAs) because Vue calculates diffs in memory before updating the browser. However, it usually requires a compilation step to optimize templates, and hydrating existing server-rendered HTML can be notoriously strict (hydration mismatches).
- **Regor:** Ditches the VDOM entirely. It binds directly to the actual DOM. Regor explicitly supports Static-first + dynamic islands and "Reentrance." You can mount an application multiple times over already-mounted regions or existing server-rendered HTML without destroying the elements.
- **Verdict:** Regor is significantly more flexible for integrating into existing applications, multi-page applications (MPAs), or legacy backends.

### Runtime and deployment model

- **Vue:** Commonly paired with a build pipeline for SFCs and tooling depth.
- **Regor:** Designed to require no build step. You can write standard TypeScript using tagged string templates (e.g., `html` tags for templates) and it will evaluate at runtime. Crucially, Regor features a Secure JavaScript VM for runtime compilation that adheres to strict Content Security Policies (CSP)—a common pain point when using Vue's runtime compiler in enterprise environments.
- **Verdict:** Regor wins in deployment flexibility and zero-config setups. It respects modern security policies out of the box without demanding a bundler.

### Reactivity control model

- **Vue:** Uses ES6 Proxies for a highly automated, "magical" reactivity system. You update an object, and Vue figures out what to re-render. However, this magic can sometimes abstract away performance bottlenecks, leading to over-rendering if you aren't careful with deep reactivity.
- **Regor:** Provides fine-tuned, manual control. It offers `ref` (deep reactivity) and `sref` (simple/shallow reactivity without nested observation). Furthermore, Regor provides advanced control APIs like `pause()` and `resume()` to stop a ref's auto-triggers, `entangle()` to sync two refs effortlessly, and `batch()` for precise state grouping.
- **Verdict:** Vue's reactivity is easier for beginners.. Regor’s reactivity is more flexible and transparent, giving engineers exact tools to orchestrate update semantics and prevent unwanted DOM paints.

### TypeScript ergonomics

- **Vue:** TypeScript support in Vue has improved massively, but it still relies on heavy IDE plugins (Volar) and specialized compilers (vue-tsc) to understand .vue files. The separation between the `<template>` and `<script>` requires tooling to bridge the gap.
- **Regor:** Offers native TypeScript support without workarounds. Because components and templates are defined using standard TypeScript functions, class-based contexts, and `ComponentHead<T>`, standard TypeScript compilers and IDEs understand 100% of the code immediately.
- **Verdict:** Regor offers a purer, higher-quality TypeScript experience. It leverages the language itself rather than relying on framework-specific compiler magic to provide type safety.

## Supported Directives

Regor provides a set of directives that allow you to enhance the behavior and appearance of your applications. Similar to Vue's directives, Regor's directives start with the "r-" prefix.

> **Note:** The directive prefix "r-" can be customized using `RegorConfig.getDefault().setDirectives('v-')` to align with a different naming convention, such as Vue's "v-" prefix.

- **`r-bind`** Binds an element's attribute to a component's data, allowing dynamic updates.
- **`r-model`** Enables two-way data binding between form inputs.
- **`r-text`** Sets the element's text content to the result of an expression.
- **`r-html`** Renders the result of an expression as HTML content within the element.
- **`r-on`** Attaches event listeners to the element and invokes specified component methods.
- **`r-show`** Conditionally displays the element based on the truthiness of an expression.
- **`r-for`** Renders a set of elements based on an array and a template.
- **`r-if`** Conditionally renders the element based on the truthiness of an expression.
- **`r-else`** Provides an alternative rendering when used in conjunction with r-if.
- **`r-else-if`** Conditionally renders the element as an alternative to r-if.
- **`r-pre`** Excludes HTML element from Regor bindings.
- **`:class`** Binds one or more class names to an element based on expressions.
- **`:style`** Binds one or more inline styles to an element based on expressions.
- **`:ref`** Provides a reference to an element in the template, allowing you to interact with it programmatically.
- **`:key`** Provides a unique identifier for each item in a list, aiding efficient updates and rendering.
- **`:is`** Specifies the component to dynamically render based on a value or expression.
- **`r-teleport`** Teleports the element to anywhere in the DOM. Unlike Vue, teleport is a directive to avoid component overhead.
- **`:props`** Vue uses v-bind for component property passing. However, this can conflict with v-bind's attribute fall-through logic. Hence, Regor defines a dedicated directive to pass properties using object syntax. It enables passing properties without defining them in the component's props contract.
- **`:props-once`** Similar to :props but it doesn't observe entire reactive tree of the template expression. Tail reactivity still works.
- **`@`** Shorthand for `r-on` to bind event listeners.
- **`:`** Shorthand for `r-bind` to bind element attributes.
- **`.`** Shorthand for `r-bind.prop` to set properties.

These directives empower you to create dynamic and interactive user interfaces, enhancing the user experience of your Regor-powered applications.

## Regor API

**App / Component Template Functions**

- **`createApp`** Similar to Vue's `createApp`, it initializes a Regor application instance.
- **`defineComponent`** Creates a Regor component instance.
- **`toFragment`** Converts a JSON template to a document fragment.
- **`toJsonTemplate`** Converts a DOM element to a JSON template.

**Cleanup Functions**

- **`addUnbinder`** Adds an unbinder to a DOM element.
- **`getBindData`** Retrieves bind data associated with a DOM element.
- **`removeNode`** Removes a node while properly disposing of associated bind data and observers.
- **`unbind`** Unbinds a node, disposing of observers and bind data.

**Compute Functions**

- **`computed`** Similar to Vue's `computed`, it creates a computed property.
- **`computed`** Computes the value observing a single ref, more efficient than observing any.
- **`computeMany`** Computes the value observing given refs, more efficient than observing any.
- **`watchEffect`** Similar to Vue's `watchEffect`, it watches for reactive changes.
- **`collectRefs`** Like `watchEffect`, but runs once and returns all refs used in the evaluated action.
- **`silence`** Silences the ref collection in a `watchEffect` or `collectRefs`.

**Misc Functions**

- **`flatten`** Flattens a given ref object into a raw object recursively.
- **`isRaw`** Checks if a given ref is marked as raw.
- **`markRaw`** Marks a ref as raw.
- **`persist`** Persists a given ref in local storage reactively.
- **`html`** A tag to produce HTML string using template literals. Recommended to use with the VS-Code [`lit-html`](https://marketplace.visualstudio.com/items?itemName=bierner.lit-html) extension for formatting and highlighting.
- **`raw`** A tag to produce HTML string, similar to `html`, but it is excluded from formatting when [`lit-html`](https://marketplace.visualstudio.com/items?itemName=bierner.lit-html) extension is installed.

**Observe Functions**

- **`observe`** Observes changes in a single ref.
- **`observeMany`** Observes changes in multiple refs.
- **`observerCount`** Retrieves the active observer count of a ref.
- **`batch`** Performs batch updates, triggering changes at the end. Use with caution due to possible dirty reads.
- **`startBatch`** Starts a batch update.
- **`endBatch`** Ends a started batch update and triggers affected refs.

**Reactivity Functions**

- **`ref`** Creates a deep ref object recursively, modifying the source object in place.
- **`sref`** Creates a simple ref object from a given value, without nested ref creation.
- **`isDeepRef`** Returns true if a given ref is created with `ref()` function.
- **`isRef`** Returns true for any ref, false for non-refs.
- **`pause`** Pauses a ref's auto-trigger on value change.
- **`resume`** Resumes a ref's auto-trigger on value change.
- **`trigger`** Manually triggers a ref to inform its observers.
- **`unref`** Unwraps a ref, returning the raw value.
- **`entangle`** Entangles two refs to sync their value changes.

**Composition Functions**

- **`useScope`** In a scope, you can use `onMounted` and `onUnmounted` functions. Components are always created in scope. Use the useScope for apps created by createApp. Similar to Vue's `effectScope`, useScope provides efficient cleanup of watchEffects, computed refs, observers and enables the `onMounted` and `onUnmounted` calls in the scope.
- **`onMounted`** Similar to Vue's `onMounted`, it executes when the component is mounted.
- **`onUnmounted`** Similar to Vue's `onUnmounted`, it executes when the component is unmounted.

**Log Configuration**

- **`warningHandler`** Customize or turn off console warnings.

## Contributing

This project welcomes contributions and suggestions. Please follow [CONTRIBUTING.md](.github/CONTRIBUTING.md) instructions.

## Acknowledgments

Regor is built upon the shoulders of giants, drawing inspiration from Vue and its vibrant community of contributors. The well-defined concepts and principles from Vue have played a pivotal role in shaping Regor's foundation. We extend our heartfelt gratitude to the Vue project and its dedicated contributors for their pioneering work in the realm of UI frameworks.

Special thanks to the Vue team and its community for creating a thriving ecosystem that continues to inspire innovation in the field of web development.

Regor also utilizes [**Jsep**](https://github.com/EricSmekens/jsep), a fast and lightweight JavaScript expression parser. Jsep's contribution to Regor's functionality is greatly appreciated.

We also extend a warm welcome to any future contributors who join the Regor project. Your contributions will play a vital role in shaping the framework's growth and evolution.

Thank you to everyone who has contributed, inspired, and supported Regor's development journey. Your dedication and passion are invaluable.
