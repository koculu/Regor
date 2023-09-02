# `persist`

## Overview

The `persist` function is a utility provided by Regor. It allows you to persist the state of a ref in the browser's `localStorage` by associating it with a unique `key`. This enables you to store and retrieve the state of the ref across page reloads or even when the browser is closed and reopened.

## Usage

### Persisting a Ref

To persist the state of a ref, call the `persist` function, passing the ref you want to persist and a unique `key` as arguments. The `key` is used to identify the stored data in `localStorage`.

```javascript
import { ref, persist } from 'regor'

// Create a ref
const myRef = ref(5)

// Persist the ref with a unique key
persist(myRef, 'myPersistedRef')
```

### Retrieving a Persisted Ref

You can retrieve a persisted ref by calling the `persist` function again with the same `key`. If the data for that key exists in `localStorage`, the ref's state will be restored from the stored data.

```javascript
// Retrieve a previously persisted ref
const myPersistedRef = persist(ref(0), 'myPersistedRef')

console.log(myPersistedRef.value) // Output: The value stored in localStorage
```

## Parameters

- `anyRef` (required): The ref that you want to persist in `localStorage`.

- `key` (required): A string key that uniquely identifies the persisted data in `localStorage`.

## Return Value

The `persist` function returns the same ref that was passed as `anyRef`. This allows you to use the ref as usual in your application.

## Notes

- The `persist` function is particularly useful for preserving the state of application data, user preferences, or settings across different browser sessions.

- It leverages the `localStorage` API to store and retrieve data, making it accessible even after the browser is closed and reopened.

- If the `localStorage` data for the specified `key` does not exist (e.g., during the first use or after clearing browser data), the `persist` function will store the initial state of the ref in `localStorage`.

- To update the persisted data, simply modify the ref's value, and the changes will be automatically stored in `localStorage` and synchronized across different browser sessions.

## See Also

- [`ref`](ref.md)
- [`flatten`](flatten.md)
- [`watchEffect`](watchEffect.md)
- [`localStorage` Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

[Back to the API list](regor-api.md)
