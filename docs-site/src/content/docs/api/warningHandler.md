---
title: warningHandler
---

# `warningHandler`

## Overview

The `warningHandler` is a configuration object in Regor that specifies how warning messages should be handled. Warnings are used to provide developers with information about potential issues or best practices when using the Regor library.

## Usage

The `warningHandler` object is used to define a function for handling warning messages. By default, it is set to log warning messages to the browser console using `console.warn`. However, you can customize this behavior by providing your own warning handling function.

### Example

```javascript
import { warningHandler } from 'regor'

// Customize the warning handler to show warnings in a custom way
warningHandler.warning = (message) => {
  // Your custom warning handling logic here
  alert(`Regor Warning: ${message}`)
}

// Now, warnings will be shown using your custom logic
```

## Properties

- `warning` (Function): A function that handles warning messages. The function should accept a single argument, which is the warning message as a string. By default, it is set to `console.warn`.

## Default Behavior

By default, the `warningHandler` is configured to use `console.warn` to log warning messages to the browser's console. This is the recommended behavior for most cases, as it allows developers to see warnings during development and debugging.

## Customization

You can customize the warning handling behavior by assigning your own function to the `warning` property of the `warningHandler` object. Your custom function should accept a warning message as its argument and implement the desired handling logic. This can be useful if you want to display warnings in a different way, such as showing them in a dialog box or sending them to a server for monitoring.

## Production Note

In a production environment, it is common practice to turn off warning messages to improve the performance of your application. You can replace the warning function with a no-op (empty) function or remove the custom warningHandler configuration entirely to disable warnings in production.

This ensures that warnings do not impact the user experience in production while still providing valuable information during development and debugging.

## Notes

- Warnings in Regor are typically used to inform developers about potential issues or best practices related to the usage of the library. They are not errors but serve as helpful hints to improve code quality and maintainability.

- You can configure the warning handler at the beginning of your Regor application to customize how warning messages are displayed or logged.

- The `warningHandler` allows you to adapt Regor's behavior to your specific development and debugging needs.

[Back to the API list](regor-api.md)
