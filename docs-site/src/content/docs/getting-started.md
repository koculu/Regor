---
title: Getting Started
sidebar:
  order: 2
---

Welcome to Regor! This guide will walk you through the essential steps to start building HTML5-based applications using the Regor UI framework. Whether you're new to Regor or an experienced developer, this guide will help you get up and running quickly.

## Installation

Before you can begin using Regor, you need to add it to your project. You can install Regor using npm or yarn.

**Using yarn**

```sh
yarn add regor
```

**Using npm**

```sh
npm install regor
```

## Import into Typescript file

```ts
import { createApp, ref } from 'regor'

createApp({
  message: ref('Hello world!'),
})
```

## Using the global build

```html
<script src="https://unpkg.com/regor/dist/regor.es2022.iife.prod.js"></script>
```

## Using the module script

```html
<div id="app">{{ message }}</div>
<script type="module">
  import {
    createApp,
    ref,
  } from 'https://unpkg.com/regor/dist/regor.es2022.esm.prod.js'
  createApp({
    message: ref('Hello world!'),
  })
</script>
```

[Back to the main](/index)
