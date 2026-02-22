import { expect, test } from 'vitest'

import { createApp, createComponent, html, ref } from '../../src'

test('r-model expression flag int converts input to integer', () => {
  const root = document.createElement('div')
  const count = ref(0)
  createApp(
    { count },
    { element: root, template: html`<input r-model="count, 'int'" />` },
  )
  const input = root.querySelector('input') as HTMLInputElement
  input.value = '7.8'
  input.dispatchEvent(new Event('input'))
  expect(count()).toBe(7)
})

test('r-model trim flag removes whitespace', () => {
  const root = document.createElement('div')
  const msg = ref('')
  createApp(
    { msg },
    { element: root, template: html`<input r-model="msg, 'trim'" />` },
  )
  const input = root.querySelector('input') as HTMLInputElement
  input.value = '  hello  '
  input.dispatchEvent(new Event('input'))
  expect(msg()).toBe('hello')
})

test('r-model.lazy updates only on change', () => {
  const root = document.createElement('div')
  const val = ref('')
  createApp(
    { val },
    { element: root, template: html`<input r-model.lazy="val" />` },
  )
  const input = root.querySelector('input') as HTMLInputElement
  input.value = 'a'
  input.dispatchEvent(new Event('input'))
  expect(val()).toBe('')
  input.dispatchEvent(new Event('change'))
  expect(val()).toBe('a')
})

test('r-model number flag converts to number', () => {
  const root = document.createElement('div')
  const num = ref(0)
  createApp(
    { num },
    { element: root, template: html`<input r-model="num, 'number'" />` },
  )
  const input = root.querySelector('input') as HTMLInputElement
  input.value = '5.5'
  input.dispatchEvent(new Event('input'))
  expect(num()).toBe(5.5)
  input.value = 'foo'
  input.dispatchEvent(new Event('input'))
  expect(num()).toBe('')
})

test('r-model with input type number converts to number without number flag', () => {
  const root = document.createElement('div')
  const amount = ref(0)
  createApp(
    { amount },
    { element: root, template: html`<input type="number" r-model="amount" />` },
  )
  const input = root.querySelector('input') as HTMLInputElement
  input.value = '12.5'
  input.dispatchEvent(new Event('input'))
  expect(amount()).toBe(12.5)
})

test('r-model with input type number sets empty string for invalid input', () => {
  const root = document.createElement('div')
  const amount = ref(0)
  createApp(
    { amount },
    { element: root, template: html`<input type="number" r-model="amount" />` },
  )
  const input = root.querySelector('input') as HTMLInputElement
  input.value = 'foo'
  input.dispatchEvent(new Event('input'))
  expect(amount()).toBe('')
})

test('r-model with input type number reflects model updates in DOM', () => {
  const root = document.createElement('div')
  const amount = ref(0)
  createApp(
    { amount },
    { element: root, template: html`<input type="number" r-model="amount" />` },
  )
  const input = root.querySelector('input') as HTMLInputElement

  amount(42.75)
  expect(input.value).toBe('42.75')
})

test('r-model input type number retargets after selected ref replacement without component', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ port: 1 })

  createApp(
    { selectedHost },
    {
      element: root,
      template: html`<input type="number" r-model="selectedHost.port" />`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  selectedHost(ref({ port: 2 }))
  expect(input.value).toBe('2')
  selectedHost().port(3)
  expect(input.value).toBe('3')

  input.value = '4'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().port()).toBe(4)
})

test('r-model input type number retargets through component prop after selected ref replacement', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ port: 1 })
  const hostInputField = createComponent(
    html`<input type="number" r-model="model" />`,
    ['model'],
  )

  createApp(
    {
      selectedHost,
      components: {
        hostInputField,
      },
    },
    {
      element: root,
      template: html`<HostInputField
        :model="selectedHost.port"
      ></HostInputField>`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  selectedHost(ref({ port: 2 }))
  expect(input.value).toBe('2')
  selectedHost().port(3)
  expect(input.value).toBe('3')

  input.value = '4'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().port()).toBe(4)

  selectedHost(ref({ port: 5 }))
  expect(input.value).toBe('5')
  input.value = '6'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().port()).toBe(6)
})

test('r-model with checkboxes populates array', () => {
  const root = document.createElement('div')
  const selected = ref<string[]>([])
  createApp(
    { selected },
    {
      element: root,
      template: html`<input type="checkbox" value="a" r-model="selected" />
        <input type="checkbox" value="b" r-model="selected" />`,
    },
  )
  const [c1, c2] = root.querySelectorAll(
    'input',
  ) as NodeListOf<HTMLInputElement>
  c1.checked = true
  c1.dispatchEvent(new Event('change'))
  expect(JSON.stringify(selected())).toBe('["a"]')
  c2.checked = true
  c2.dispatchEvent(new Event('change'))
  expect(JSON.stringify(selected())).toBe('["a","b"]')
  c1.checked = false
  c1.dispatchEvent(new Event('change'))
  expect(JSON.stringify(selected())).toBe('["b"]')
})

test('r-model with select multiple populates set', () => {
  const root = document.createElement('div')
  const opts = ref(new Set<string>())
  createApp(
    { opts },
    {
      element: root,
      template: html`<select r-model="opts" multiple>
        <option value="x">x</option>
        <option value="y">y</option>
      </select>`,
    },
  )
  const select = root.querySelector('select') as HTMLSelectElement
  const optionX = select.options[0]
  const optionY = select.options[1]
  optionX.selected = true
  select.dispatchEvent(new Event('change'))
  expect(opts().has('x')).toBe(true)
  optionY.selected = true
  select.dispatchEvent(new Event('change'))
  expect(Array.from(opts())).toStrictEqual(['x', 'y'])
  optionX.selected = false
  select.dispatchEvent(new Event('change'))
  expect(Array.from(opts())).toStrictEqual(['y'])
})

test('demonstrates stale model target through component prop after selected ref replacement', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })
  const hostInputField = createComponent(
    html`<input type="text" r-model="model" />`,
    ['model'],
  )

  createApp(
    {
      selectedHost,
      components: {
        hostInputField,
      },
    },
    {
      element: root,
      template: html`<HostInputField
        :model="selectedHost.hostname"
      ></HostInputField>`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  selectedHost(ref({ hostname: 'beta' }))
  expect(input.value).toBe('beta')
  selectedHost().hostname('new-value')
  expect(input.value).toBe('new-value')
  input.value = 'updated-beta'
  input.dispatchEvent(new Event('input'))

  // This currently fails: model keeps targeting the old hostname ref created before selectedHost replacement.
  expect(selectedHost().hostname()).toBe('updated-beta')
})

test('demonstrates stale model target after selected ref replacement without component', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })

  createApp(
    { selectedHost },
    {
      element: root,
      template: html`<input type="text" r-model="selectedHost.hostname" />`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  selectedHost(ref({ hostname: 'beta' }))
  expect(input.value).toBe('beta')
  selectedHost().hostname('new-value')
  expect(input.value).toBe('new-value')
  input.value = 'updated-beta'
  input.dispatchEvent(new Event('input'))

  // Mirrors the component case but with a direct binding target.
  expect(selectedHost().hostname()).toBe('updated-beta')
})

test('r-model through component prop tracks writes after selected ref replacement', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })
  const hostInputField = createComponent(
    html`<input type="text" r-model="model" />`,
    ['model'],
  )

  createApp(
    {
      selectedHost,
      components: {
        hostInputField,
      },
    },
    {
      element: root,
      template: html`<HostInputField
        :model="selectedHost.hostname"
      ></HostInputField>`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  selectedHost(ref({ hostname: 'beta' }))
  expect(input.value).toBe('beta')
  selectedHost().hostname('new-value')
  expect(input.value).toBe('new-value')
  input.value = 'updated-beta'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().hostname()).toBe('updated-beta')

  input.value = 'updated-beta-2'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().hostname()).toBe('updated-beta-2')
})

test('r-model through component prop keeps parent-to-input sync after selected ref replacement', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })
  const hostInputField = createComponent(
    html`<input type="text" r-model="model" />`,
    ['model'],
  )

  createApp(
    {
      selectedHost,
      components: {
        hostInputField,
      },
    },
    {
      element: root,
      template: html`<HostInputField
        :model="selectedHost.hostname"
      ></HostInputField>`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  selectedHost(ref({ hostname: 'beta' }))
  expect(input.value).toBe('beta')
  selectedHost().hostname('from-parent')

  expect(input.value).toBe('from-parent')
})

test('r-model direct binding tracks latest ref across multiple selected ref replacements', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })

  createApp(
    { selectedHost },
    {
      element: root,
      template: html`<input type="text" r-model="selectedHost.hostname" />`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  selectedHost(ref({ hostname: 'beta' }))
  expect(input.value).toBe('beta')
  selectedHost().hostname('new-value')
  expect(input.value).toBe('new-value')
  input.value = 'updated-beta'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().hostname()).toBe('updated-beta')

  selectedHost(ref({ hostname: 'gamma' }))
  expect(input.value).toBe('gamma')
  selectedHost().hostname('new-value-2')
  expect(input.value).toBe('new-value-2')
  input.value = 'updated-gamma'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().hostname()).toBe('updated-gamma')
})

test('edge case: r-model through component prop breaks after second selected ref replacement', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })
  const hostInputField = createComponent(
    html`<input type="text" r-model="model" />`,
    ['model'],
  )

  createApp(
    {
      selectedHost,
      components: {
        hostInputField,
      },
    },
    {
      element: root,
      template: html`<HostInputField
        :model="selectedHost.hostname"
      ></HostInputField>`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  selectedHost(ref({ hostname: 'beta' }))
  expect(input.value).toBe('beta')
  selectedHost().hostname('new-value')
  expect(input.value).toBe('new-value')
  input.value = 'updated-beta'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().hostname()).toBe('updated-beta')

  selectedHost(ref({ hostname: 'gamma' }))
  expect(input.value).toBe('gamma')
  selectedHost().hostname('new-value-2')
  expect(input.value).toBe('new-value-2')
  input.value = 'updated-gamma'
  input.dispatchEvent(new Event('input'))

  // Current behavior: this fails; write no longer targets latest ref after second replacement.
  expect(selectedHost().hostname()).toBe('updated-gamma')
})

test('two-way component model binding syncs parent and child without replacement', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })
  const hostInputField = createComponent(
    html`<input type="text" r-model="model" />`,
    ['model'],
  )

  createApp(
    {
      selectedHost,
      components: {
        hostInputField,
      },
    },
    {
      element: root,
      template: html`<HostInputField
        :model="selectedHost.hostname"
      ></HostInputField>`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  selectedHost().hostname('from-parent')
  expect(input.value).toBe('from-parent')

  input.value = 'from-child'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().hostname()).toBe('from-child')
})

test('two-way component model binding survives alternating parent and child updates after replacement', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })
  const hostInputField = createComponent(
    html`<input type="text" r-model="model" />`,
    ['model'],
  )

  createApp(
    {
      selectedHost,
      components: {
        hostInputField,
      },
    },
    {
      element: root,
      template: html`<HostInputField
        :model="selectedHost.hostname"
      ></HostInputField>`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  selectedHost(ref({ hostname: 'beta' }))
  expect(input.value).toBe('beta')
  selectedHost().hostname('parent-beta')
  expect(input.value).toBe('parent-beta')

  input.value = 'child-beta'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().hostname()).toBe('child-beta')

  selectedHost().hostname('parent-beta-2')
  expect(input.value).toBe('parent-beta-2')
})

test('two-way component model binding stays connected across multiple replacements', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })
  const hostInputField = createComponent(
    html`<input type="text" r-model="model" />`,
    ['model'],
  )

  createApp(
    {
      selectedHost,
      components: {
        hostInputField,
      },
    },
    {
      element: root,
      template: html`<HostInputField
        :model="selectedHost.hostname"
      ></HostInputField>`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  selectedHost(ref({ hostname: 'beta' }))
  expect(input.value).toBe('beta')
  selectedHost().hostname('new-value')
  expect(input.value).toBe('new-value')
  input.value = 'child-beta'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().hostname()).toBe('child-beta')

  selectedHost(ref({ hostname: 'gamma' }))
  expect(input.value).toBe('gamma')
  selectedHost().hostname('new-value-2')
  expect(input.value).toBe('new-value-2')
  selectedHost().hostname('parent-gamma')
  expect(input.value).toBe('parent-gamma')

  input.value = 'child-gamma'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().hostname()).toBe('child-gamma')
})

test('three nested components keep :model two-way binding across replacements', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })

  const leafInputField = createComponent(
    html`<input type="text" r-model="model" />`,
    ['model'],
  )
  const middleInputField = createComponent(
    html`<LeafInputField :model="model"></LeafInputField>`,
    {
      props: ['model'],
      context: () => ({
        components: {
          leafInputField,
        },
      }),
    },
  )
  const outerInputField = createComponent(
    html`<MiddleInputField :model="model"></MiddleInputField>`,
    {
      props: ['model'],
      context: () => ({
        components: {
          middleInputField,
        },
      }),
    },
  )

  createApp(
    {
      selectedHost,
      components: {
        outerInputField,
      },
    },
    {
      element: root,
      template: html`<OuterInputField
        :model="selectedHost.hostname"
      ></OuterInputField>`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  selectedHost().hostname('parent-alpha')
  expect(input.value).toBe('parent-alpha')

  input.value = 'child-alpha'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().hostname()).toBe('child-alpha')

  selectedHost(ref({ hostname: 'beta' }))
  expect(input.value).toBe('beta')
  selectedHost().hostname('parent-beta')
  expect(input.value).toBe('parent-beta')

  input.value = 'child-beta'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().hostname()).toBe('child-beta')
  selectedHost().hostname('new-value')
  expect(input.value).toBe('new-value')

  selectedHost(ref({ hostname: 'gamma' }))
  expect(input.value).toBe('gamma')
  input.value = 'child-gamma'
  input.dispatchEvent(new Event('input'))
  expect(selectedHost().hostname()).toBe('child-gamma')
  selectedHost().hostname('new-value-2')
  expect(input.value).toBe('new-value-2')
})

test('regression: selecting host from list should not overwrite previous host item values', () => {
  const root = document.createElement('div')
  const hostItems = ref([{ hostname: 'host-a' }, { hostname: 'host-b' }])
  const selectedHost = ref(hostItems()[0]())
  const hostInputField = createComponent(
    html`<input type="text" r-model="model" />`,
    ['model'],
  )

  createApp(
    {
      selectedHost,
      components: {
        hostInputField,
      },
    },
    {
      element: root,
      template: html`<HostInputField
        :model="selectedHost.hostname"
      ></HostInputField>`,
    },
  )

  const input = root.querySelector('input') as HTMLInputElement | null
  if (!input) throw new Error('missing input')

  expect(hostItems()[0]().hostname()).toBe('host-a')
  expect(hostItems()[1]().hostname()).toBe('host-b')
  expect(input.value).toBe('host-a')

  // Switching selection should not mutate existing host item data.
  selectedHost(hostItems()[1]())
  expect(input.value).toBe('host-b')
  expect(hostItems()[1]().hostname()).toBe('host-b')
  expect(hostItems()[0]().hostname()).toBe('host-a')
})
