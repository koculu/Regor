---
title: r-model Directive
---

# r-model Directive

The `r-model` directive provides two-way data binding for form elements in your Regor components. It allows you to bind the value of form inputs to a component's data, ensuring that changes to the input are reflected in the component's data and vice versa.

## Syntax

```html
<element r-model="expression"></element>
```

- `<element>`: The form element (e.g., input, textarea, select) that you want to bind to.
- `expression`: An expression that represents the data property you want to bind the element to. This can be a single variable or a more complex expression.

## Usage

The `r-model` directive is commonly used with form inputs like text fields, checkboxes, radio buttons, and select elements. It establishes a two-way binding between the input's value and the specified data property in your Regor component.

### Example

```html
<div>
  <input type="text" r-model="message" />
  <p>You typed: {{ message }}</p>
</div>
```

In this example, the `r-model` directive is used to bind the value of the text input to the `message` property in your component's data. Any changes made to the input field will automatically update the `message` property, and vice versa.

### Two-Way Data Binding

The `r-model` directive creates a two-way data binding between the form element and the component's data. This means that changes to either the form element's value or the component's data property are synchronized in real-time.

### Supported Form Elements

The `r-model` directive can be used with various types of form elements:

- Text Input (`<input type="text">`)
- Textarea (`<textarea>`)
- Select Dropdown (`<select>`)
- Checkbox (`<input type="checkbox">`)
- Radio Button (`<input type="radio">`)
- Number Input (`<input type="number">` and `<input type="range">`)

### Example with Checkbox

```html
<div>
  <input type="checkbox" r-model="isChecked" />
  <p>Is Checked: {{ isChecked }}</p>
</div>
```

In this example, the `r-model` directive is used with a checkbox input. The `isChecked` property in the component's data is bound to the checkbox's checked state. When the checkbox is toggled, the `isChecked` property will be updated accordingly.

### Special Case: Checkbox and Select with Arrays or Sets

When the `r-model` directive is bound to an array or set in your component's data, it behaves differently for checkboxes and select elements:

#### Checkbox

If the bound expression is an array or set, the `r-model` directive will collect the selected values in the array or set. When multiple checkboxes are bound to the same array or set, checking or unchecking the checkboxes will add or remove values from the array or set.

```html
<div>
  <input type="checkbox" r-model="selectedItems" value="item1" />
  <input type="checkbox" r-model="selectedItems" value="item2" />
  <input type="checkbox" r-model="selectedItems" value="item3" />
  <p>Selected Items: {{ selectedItems }}</p>
</div>
```

In this example, three checkboxes are bound to the `selectedItems` array. Checking or unchecking the checkboxes will update the `selectedItems` array with the selected values.

#### Select (Dropdown)

Similarly, when the `r-model` directive is bound to an array or set, and a `select` element with the `multiple` attribute is used, it will collect the selected values in the array or set.

```html
<div>
  <select r-model="selectedOptions" multiple>
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
    <option value="option3">Option 3</option>
  </select>
  <p>Selected Options: {{ selectedOptions }}</p>
</div>
```

In this example, the `r-model` directive is used with a multi-select dropdown. The `selectedOptions` array will contain the selected values from the dropdown.

## Modifiers

The `r-model` directive supports modifiers to enable additional behavior on the bound element. Modifiers are added to the directive with a dot notation.

### Example with Modifiers

```html
<div>
  <input type="text" r-model.trim="trimmedMessage" />
  <p>Trimmed Message: {{ trimmedMessage }}</p>
</div>
```

In this example, the `.trim` modifier is used to trim any leading or trailing whitespace from the input's value before binding it to the `trimmedMessage` property.

#### Available Modifiers

- `.trim`: Removes leading and trailing whitespace from the input's value.
- `.lazy`: Updates the component's data property only when the input element emits the `change` event (useful for input fields that have debounced input events).
- `.number`: Converts the input's value to a numeric type (e.g., `Number`) before binding it to the data property.
- `.int`: Converts the input's value to an integer type (e.g., `parseInt`) before binding it to the data property.

You can use these modifiers individually or combine them to achieve the desired behavior for your form elements.

## Notes

- The `r-model` directive is ideal for creating interactive forms and ensuring that user input is synchronized with your component's data.

- For checkboxes and radio buttons, the `r-model` directive binds the `checked` property of the element to the data property, reflecting the boolean state of the checkbox or radio button.

- Changes to the input element's value due to user interactions, such as typing in a text field or selecting options in a dropdown, are automatically reflected in the bound data property.

- Changes to the data property bound with `r-model` are automatically reflected in the form element's value, allowing you to programmatically update the input's content.

- Modifiers provide additional control over the data binding behavior, allowing you to customize how data is processed and updated between the form element and the component's data.

The `r-model` directive simplifies the process of creating interactive forms in your Regor-powered applications by enabling two-way data binding between form elements and your component's data properties. It ensures that your forms remain in sync with the underlying data, providing a seamless user experience.

[Back to the directives](directives.md)
