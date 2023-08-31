import { test } from 'vitest'
import { createApp, html, raw, ref } from '../../src'
import { htmlEqual } from '../common/html-equal'

test('should bind reactive attributes.', () => {
  const root = document.createElement('<div>')
  const app = createApp(
    {
      class1: ref('c1'),
      class2: ref('c2'),
      class3: ref('c3'),
      dynamicKey: ref('src'),
      imgSrc: ref('/foo.png'),
    },
    {
      element: root,
      html: html`<div>
        <div class="a" :className="class1"></div>
        <img class="a" r-bind:_d_dynamic-key_d_="imgSrc" />
        <div class="a" r-bind:className="class1"></div>
        <div class="a" :class-name="class2"></div>
        <div class="a" :class-name.camel.prop="class2"></div>
        <div class="a" .class-name.camel="class2"></div>
        <div class="a" :class="{ 'red': 1, 'green': 0 }"></div>
        <div class="a" :class="class3"></div>
      </div>`,
    },
  )
  htmlEqual(
    root.innerHTML,
    raw`<div>
      <div class="a" classname="c1"></div>
      <img class="a" src="/foo.png">
      <div class="a" classname="c1"></div>
      <div class="a" class-name="c2"></div>
      <div class="c2"></div>
      <div class="c2"></div>
      <div class="a red"></div>
      <div class="a c3"></div>
    </div>`,
  )
  app.context.dynamicKey.value = 'alt'
  app.context.imgSrc.value = '/img/foo.png'
  app.context.class1.value = 'e1'
  app.context.class2.value = 'e2'
  app.context.class3.value = 'e3'
  htmlEqual(
    root.innerHTML,
    raw`<div>
      <div class="a" classname="e1"></div>
      <img class="a" alt="/img/foo.png">
      <div class="a" classname="e1"></div>
      <div class="a" class-name="e2"></div>
      <div class="e2"></div>
      <div class="e2"></div>
      <div class="a red"></div>
      <div class="a e3"></div>
    </div>`,
  )
})
