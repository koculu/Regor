import { expect, test } from 'vitest'
import { createApp, ref, html, raw } from '../../src'

test('should mount the people into reactive divs.', () => {
  const root = document.createElement('div')
  const app = createApp(
    {
      people: ref([
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 22 },
        { name: 'David', age: 28 },
        { name: 'Emma', age: 20 },
        { name: 'Frank', age: 40 },
        { name: 'Grace', age: 33 },
        { name: 'Hannah', age: 19 },
        { name: 'Isaac', age: 37 },
        { name: 'Jack', age: 21 },
      ]),
    },
    {
      element: root,
      template: html`<div r-for="name, age, #i in people" :class="name">
        {{ i }} - name: {{ name }} age: {{ age }}
      </div>`,
    },
  )
  const people = app.context.people()
  const testContent = () => {
    expect(
      [...root.querySelectorAll('[class]')].map((x) => x.className),
    ).toStrictEqual(people.map((x) => x().name()))

    expect(
      [...root.querySelectorAll('span')].map((x) => x.textContent),
    ).toStrictEqual(
      people
        .map((x) => x())
        .flatMap((x, i) => [i.toString(), x.name(), x.age().toString()]),
    )
  }
  testContent()
  people[0]().name.value = 'Ali'
  people[0]().age.value = 40
  testContent()
})

test('should mount nested r-for.', () => {
  const root = document.createElement('div')
  const app = createApp(
    {
      duplicate: ref(10),
      people: ref([
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 22 },
        { name: 'David', age: 28 },
        { name: 'Emma', age: 20 },
        { name: 'Frank', age: 40 },
        { name: 'Grace', age: 33 },
        { name: 'Hannah', age: 19 },
        { name: 'Isaac', age: 37 },
        { name: 'Jack', age: 21 },
      ]),
    },
    {
      element: root,
      template: html`<div r-for="#i in duplicate">
        <div r-for="name, age, #j in people" :class="name">
          {{ j }} - name: {{ name }} age: {{ age }}
        </div>
      </div>`,
    },
  )
  const duplicateArray = <T>(n: number, items: T[]): T[] => {
    return Array.from({ length: n }, () => [...items]).flat()
  }
  const people = app.context.people()
  const duplicate = app.context.duplicate
  const testContent = () => {
    expect(
      [...root.querySelectorAll('[class]')].map((x) => x.className),
    ).toStrictEqual(
      duplicateArray(
        duplicate(),
        people.map((x) => x().name()),
      ),
    )

    expect(
      [...root.querySelectorAll('span')].map((x) => x.textContent),
    ).toStrictEqual(
      duplicateArray(
        duplicate(),
        people
          .map((x) => x())
          .flatMap((x, i) => [i.toString(), x.name(), x.age().toString()]),
      ),
    )
  }
  testContent()
  people[3]().name.value = 'Ali'
  people[7]().age.value = 40
  testContent()
  people.splice(5)
  testContent()
  people.splice(1)
  duplicate(5)
  testContent()
  people.splice(0)
  testContent()
  duplicate(0)
  testContent()
})

test('should iterate using of syntax', () => {
  const root = document.createElement('div')
  createApp(
    {
      fruits: ref(['Apple', 'Banana']),
    },
    {
      element: root,
      template: html`<div r-for="fruit of fruits">{{ fruit }}</div>`,
    },
  )
  expect([...root.querySelectorAll('div')].map((x) => x.textContent)).toStrictEqual([
    'Apple',
    'Banana',
  ])
})

test('should support index variable with parentheses', () => {
  const root = document.createElement('div')
  createApp(
    {
      fruits: ref(['Apple', 'Banana']),
    },
    {
      element: root,
      template: html`<div r-for="(fruit, #i) in fruits">{{ i }} - {{ fruit }}</div>`,
    },
  )
  expect([...root.querySelectorAll('span')].map((x) => x.textContent)).toStrictEqual([
    '0',
    'Apple',
    '1',
    'Banana',
  ])
})

test('should iterate object properties', () => {
  const root = document.createElement('div')
  createApp(
    {
      person: ref({ name: 'Alice', age: 25 }),
    },
    {
      element: root,
      template: html`<div r-for="(key, value) in person">{{ key }}: {{ value }}</div>`,
    },
  )
  expect([...root.querySelectorAll('span')].map((x) => x.textContent)).toStrictEqual([
    'name',
    'Alice',
    'age',
    '25',
  ])
})

test('should support object destructuring with index', () => {
  const root = document.createElement('div')
  createApp(
    {
      users: ref([
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ]),
    },
    {
      element: root,
      template: html`<div r-for="{ name, age }, #index in users">{{ index }} - {{ name }} - {{ age }}</div>`,
    },
  )
  expect([...root.querySelectorAll('span')].map((x) => x.textContent)).toStrictEqual([
    '0',
    'Alice',
    '25',
    '1',
    'Bob',
    '30',
  ])
})

