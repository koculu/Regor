---
title: r-on Directive
---


The `r-on` directive in Regor is used to attach event listeners to HTML elements and invoke specified component methods when those events occur. It provides a way to make your components interactive and responsive to user actions.

## Usage

The `r-on` directive is typically used in the following format:

```html
<element r-on:event="handlerMethod"></element>
```

- `element`: The HTML element to which the event listener is attached.
- `event`: The name of the DOM event to listen for (e.g., "click," "input," "submit").
- `handlerMethod`: The name of the component method that should be invoked when the event occurs.

### Shorthand

You can use the shorthand notation `@` to achieve the same effect as `r-on`. For example, the following two lines of code are equivalent:

```html
<element r-on:event="handlerMethod"></element>
<element @event="handlerMethod"></element>
```

### Supported Flags

The `r-on` directive supports various flags that allow you to customize event handling behavior. Flags are added to the event name and are separated by commas. Here are the available flags:

- `stop`: Stops event propagation, preventing it from bubbling up the DOM tree.
- `prevent`: Prevents the default behavior of the event from occurring (e.g., form submission).
- `capture`: Listens for the event during the capture phase instead of the bubble phase.
- `self`: Ensures that the event handler is only triggered if the event target matches the element.
- `once`: Ensures that the event handler is executed only once and then automatically unbinds itself.
- `passive`: When this flag is specified, the event listener is set as passive, which can help improve performance. Passive event listeners are not allowed to call preventDefault() on the event

For mouse events:

- `left`: Specifies that the event should only trigger when the left mouse button is clicked.
- `right`: Specifies that the event should only trigger when the right mouse button is clicked.
- `middle`: Specifies that the event should only trigger when the middle mouse button is clicked.

For key events:

- `ctrl`: Specifies that the event should only trigger when the Ctrl key is pressed.
- `shift`: Specifies that the event should only trigger when the Shift key is pressed.
- `alt`: Specifies that the event should only trigger when the Alt key is pressed.
- `meta`: Specifies that the event should only trigger when the Meta key (e.g., Command key on Mac) is pressed.

You can also specify any valid key from the KeyboardEvent key values as a flag. This allows you to define custom key combinations for event handling.

Here's an example of how you can use these flags in event handling:

```html
<element r-on:click.left="handleLeftClick"></element>
<element r-on:keydown.ctrl.meta="handleCtrlMetaKey"></element>
<element r-on:keyup.enter="handleEnterKey"></element>
```

For example:

```html
<button @click.stop.prevent="handleClick">Click Me</button>
```

In the above example, the `click` event will be handled by the `handleClick` method of the component, and event propagation and default behavior will be stopped.

### Dynamic Event Handling

You can dynamically bind events and event handlers using expressions. This is useful when you need to conditionally attach event listeners.

```html
<element r-on:[eventName]="handlerMethod"></element>
```

In this case, `eventName` should be a component data property that contains the event name as a string, and `handlerMethod` is the method to be invoked when the event occurs.

### Object Syntax

You can use object syntax with the `r-on` directive to attach multiple event listeners to the same element. This is particularly useful when binding multiple events with different event handlers.

```html
<element
  r-on="{
  event1: handlerMethod1,
  event2: handlerMethod2,
  ...
}"
></element>
```

In the above example, the element will have multiple event listeners attached, each invoking a different component method when the specified events occur.

## Notes

- The `r-on` directive is a powerful tool for making your components interactive by listening to DOM events.

- You can use it to handle a wide range of events, such as click, input, submit, and more.

- Event handlers are defined as component methods, allowing you to encapsulate logic and functionality.

- Flags provide fine-grained control over event handling, allowing you to stop event propagation, prevent default behavior, and more.

- Dynamic event binding allows you to conditionally attach event listeners based on component data.

- Object syntax simplifies the binding of multiple events to the same element, making your code more concise and readable.

- You can use `r-on` in conjunction with other directives like `r-bind`, `r-model`, and `r-show` to create interactive and responsive user interfaces.

## See Also

- [r-model Directive](r-model.md)
- [r-text Directive](r-text.md)
- [r-html Directive](r-html.md)
- [r-on Directive](r-on.md)
- [r-show Directive](r-show.md)

[Back to the directives](directives.md)
