---
title: contextRegistry
---

## Overview

`ContextRegistry` is a utility class for explicit context sharing across
component trees.

It stores context instances by constructor and lets you resolve them by type.
Lookup uses `instanceof`, so querying by a base class can return a subclass
instance.

## Usage

```ts
import { ContextRegistry } from 'regor'

class AppServices {
  readonly apiBase = '/v1'
}

const registry = new ContextRegistry()
registry.register(new AppServices())

const services = registry.require(AppServices)
```

## API

### `register(context)`

Registers an instance under its runtime constructor.

- If another instance of the same constructor is already registered, it is
  replaced.

### `unregisterByClass(ContextClass)`

Removes the entry for a constructor.

- No-op when that constructor is not registered.

### `unregister(context)`

Removes an instance only if it is currently the registered value for its
constructor.

- This prevents deleting a newer replacement instance registered later.

### `find(ContextClass)`

Returns the first registered instance matching `instanceof ContextClass`, or
`undefined`.

### `require(ContextClass)`

Returns the same result as `find`, but throws when not found.

- Error message format: `ClassName is not registered in ContextRegistry.`

## Example: parent provides registry, child resolves from `head.requireContext`

```ts
import { ComponentHead, ContextRegistry, defineComponent } from 'regor'

class AppServices {
  readonly apiBase = '/v1'
}

class Parent {
  readonly registry = new ContextRegistry()

  constructor() {
    this.registry.register(new AppServices())
  }
}

class Child {
  readonly apiBase: string

  constructor(head: ComponentHead<object>) {
    // Parent can provide registry from any component context shape.
    const parent = head.requireContext(Parent)
    const services = parent.registry.require(AppServices)
    this.apiBase = services.apiBase
  }
}

const parent = defineComponent<Parent>('<div><slot></slot></div>', {
  context: () => new Parent(),
})

const child = defineComponent<Child>('<p r-text="apiBase"></p>', {
  context: (head) => {
    return new Child(head)
  },
})
```

## Example: component ctx <=> component ctx communication through parent registry

```ts
import {
  ComponentHead,
  ContextRegistry,
  createApp,
  defineComponent,
  html,
  ref,
} from 'regor'

class Parent {
  components = { producer, consumer }
  registry = new ContextRegistry()
}

class Consumer {
  message = ref('idle')
  private readonly parent: Parent

  constructor(head: ComponentHead<object>) {
    this.parent = head.requireContext(Parent)
    this.parent.registry.register(this)
  }

  receive = (next: string): void => {
    this.message(next)
  }
}

class Producer {
  private readonly parent: Parent

  constructor(head: ComponentHead<object>) {
    this.parent = head.requireContext(Parent)
    this.parent.registry.register(this)
  }

  send = (): void => {
    // direct component-ctx -> component-ctx call through registry
    const consumer = this.parent.registry.require(Consumer)
    consumer.receive('message-from-producer')
  }
}

const producer = defineComponent<Producer>(
  html`<button class="send" @click="send">send</button>`,
  {
    context: (head) => new Producer(head),
  },
)

const consumer = defineComponent<Consumer>(
  html`<p class="value">{{ message }}</p>`,
  {
    context: (head) => new Consumer(head),
  },
)

const parent = defineComponent<Parent>(
  html`<section>
    <Producer></Producer>
    <Consumer></Consumer>
  </section>`,
  {
    context: () => new Parent(),
  },
)

createApp(
  { components: { parent } },
  {
    element: document.querySelector('#app')!,
    template: '<Parent></Parent>',
  },
)
```

## See Also

- [`defineComponent`](/api/defineComponent)
- [`useScope`](/api/useScope)
- [Components Guide](/guide/components)
- [TypeScript Guide](/guide/typescript)

[Back to the API list](/api/)
