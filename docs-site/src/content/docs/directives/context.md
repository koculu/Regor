---
title: :context Directive
---

`:context` assigns an object into a component instance context, reactively.
`r-context` is an alias with the same behavior.

Use it when you want to pass multiple values to a component in one place, including fields that are not declared in `props`.

## What it does

```html
<MyComponent :context="{ title: pageTitle, theme: activeTheme }"></MyComponent>
<MyComponent r-context="{ title: pageTitle, theme: activeTheme }"></MyComponent>
```

In the component, `title` and `theme` become available as component context fields (or update existing ref fields when applicable).  
When `pageTitle` or `activeTheme` changes, the component values are updated.

## When to use `:context`

Use `:context` for object-style component input.
`r-context` is equivalent and can be used interchangeably.

Use `:prop-name="value"` or `r-bind:prop-name="value"` (same single-prop binding behavior) when the prop is declared in the component `props` list.

Use object-form attribute binding (`r-bind="{...}"` or `:="{...}"`) for normal host attribute fallthrough, not for component context assignment.

## Example

```html
<UserCard
  :user-id="selectedUserId"
  :context="{ badge: userBadge, canEdit: isAdmin }"
></UserCard>
```

```ts
const UserCard = defineComponent('<section>...</section>', {
  props: ['userId'],
  context: (head) => ({
    userId: head.props.userId,
    badge: head.props.badge,
    canEdit: head.props.canEdit,
  }),
})
```

In this example:

- `userId` comes from declared prop binding (`:user-id`)
- `badge` and `canEdit` come from `:context`

[Back to the directives](/directives/)
