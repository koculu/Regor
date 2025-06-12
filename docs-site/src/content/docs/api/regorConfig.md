---
title: RegorConfig
---

# `RegorConfig`

## Overview

The `RegorConfig` class is used to configure and customize the behavior of the Regor library. It provides options for setting directives, global context, and other configuration parameters.

## Usage

The `RegorConfig` class is typically used to create a configuration object that can be passed to Regor during initialization. You can customize various aspects of Regor's behavior using this configuration.

### Example

```ts
import { RegorConfig } from 'regor'

// Create a new RegorConfig with custom global context
const config = new RegorConfig({
  customGlobalFunction: () => {
    // Your custom global function logic here
  },
  // ...other global variables
})

// Use the custom configuration when creating a Regor app
const app = createApp(context, template, config)
```

## Constructor

The `RegorConfig` constructor allows you to create an instance of the `RegorConfig` class with optional initial configuration options.

### Parameters

- `globalContext` (optional): A custom global context object that can be used to define global variables and functions accessible within Regor templates.

## Properties

### `globalContext` (Record<string, any>)

This property holds the global context object, which can be used to define global variables and functions accessible within Regor templates. You can customize this context during configuration.

### `useInterpolation` (boolean)

- Default: `true`

This property controls whether Regor should enable interpolation for data binding. When set to `true`, Regor will automatically perform data binding using the `{{ }}` syntax in templates.

## Methods

### `addComponent(...)`

This method allows you to register components with Regor. Components are reusable elements that can be used in your templates. You can pass one or more components to this method for registration.

### Parameters

- `components` (Array<Component>) - One or more component objects to register.

### Example

```javascript
import { RegorConfig } from 'regor'
import { MyComponent1, MyComponent2 } from './components'

const config = new RegorConfig()

// Register custom components
config.addComponent(MyComponent1, MyComponent2)
```

### `setDirectives(prefix: string)`

This method allows you to set the prefix for directives used in Regor templates. Directives are special attributes or bindings that control how elements behave in the template.

### Parameters

- `prefix` (string) - The prefix string to use for directives. For example, setting it to `'r-'` would make directives look like `r-for`, `r-bind`, etc.

### Example

```javascript
import { RegorConfig } from 'regor'

const config = new RegorConfig()

// Set custom directive prefix
config.setDirectives('r-')
```

### `updateDirectives(updater: (directiveMap: Record<string, Directive>, builtInNames: Record<string, string>) => void)`

This method allows you to update the directives used in Regor templates by providing a custom updater function. The updater function receives two arguments: `directiveMap` and `builtInNames`, which represent the current directive mapping and built-in directive names.

### Parameters

- `updater` (Function) - A function that takes two arguments: `directiveMap` and `builtInNames`. You can use this function to modify the directive mapping and built-in names.

### Example

```javascript
import { RegorConfig } from 'regor'

const config = new RegorConfig()

// Update directives with a custom updater function
config.updateDirectives((directiveMap, builtInNames) => {
  // Customize the directive map or built-in names here
})
```

## Default Configuration

The `RegorConfig` class provides default configuration values for various properties and options. These defaults are used if no custom configuration is provided.

## Notes

- The `RegorConfig` class allows you to fine-tune Regor's behavior to match your specific application requirements.

- You can customize global context variables and functions to make them available in Regor templates.

- The `useInterpolation` property enables or disables the use of `{{}}` syntax for data binding in templates.

- Registering custom components using `addComponent` makes those components available for use in your Regor templates.

- The `setDirectives` method allows you to set a custom prefix for directives used in your templates.

- The `updateDirectives` method provides a way to modify the directive mapping and built-in names used by Regor, allowing for advanced customization.

## See Also

- [`createApp`](createApp.md)
- [`createComponent`](createComponent.md)
- [`toFragment`](toFragment.md)
- [`toJsonTemplate`](toJsonTemplate.md)

[Back to the API list](regor-api.md)
