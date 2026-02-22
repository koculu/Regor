import { expect, test } from 'vitest'

import {
  Component,
  createApp,
  createComponent,
  html,
  ref,
  sref,
  unref,
} from '../../src'

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

test('should handle lists with falsy key values', () => {
  const root = document.createElement('div')
  type objectType =
    | {
        id: number
      }
    | {
        id: boolean
      }
    | {
        id: string
      }
  const app = createApp(
    {
      items: ref<objectType[]>([
        { id: 0 },
        { id: false },
        { id: '' },
        { id: 1 },
      ]),
    },
    {
      element: root,
      template: html`<div r-for="{ id } in items" :key="id">{{ id }}</div>`,
    },
  )

  const items = app.context.items()
  const getDomText = () =>
    [...root.querySelectorAll('div')].map((x) => x.textContent)
  const getItemText = () => items.map((x) => String(unref(x().id)))
  const testContent = () => {
    expect(getDomText()).toStrictEqual(getItemText())
  }

  testContent()
  items.splice(0, 1, ref<objectType>({ id: 0 }))
  testContent()
  items.splice(1, 1, ref<objectType>({ id: false }))
  testContent()
  items.splice(2, 1, ref<objectType>({ id: '' }))
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
  expect(
    [...root.querySelectorAll('div')].map((x) => x.textContent),
  ).toStrictEqual(['Apple', 'Banana'])
})

test('should support index variable with parentheses', () => {
  const root = document.createElement('div')
  createApp(
    {
      fruits: ref(['Apple', 'Banana']),
    },
    {
      element: root,
      template: html`<div r-for="(fruit, #i) in fruits">
        {{ i }} - {{ fruit }}
      </div>`,
    },
  )
  expect(
    [...root.querySelectorAll('span')].map((x) => x.textContent),
  ).toStrictEqual(['0', 'Apple', '1', 'Banana'])
})

test('should iterate object properties', () => {
  const root = document.createElement('div')
  createApp(
    {
      person: ref({ name: 'Alice', age: 25 }),
    },
    {
      element: root,
      template: html`<div r-for="(key, value) in person">
        {{ key }}: {{ value }}
      </div>`,
    },
  )
  expect(
    [...root.querySelectorAll('span')].map((x) => x.textContent),
  ).toStrictEqual(['name', 'Alice', 'age', '25'])
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
      template: html`<div r-for="{ name, age }, #index in users">
        {{ index }} - {{ name }} - {{ age }}
      </div>`,
    },
  )
  expect(
    [...root.querySelectorAll('span')].map((x) => x.textContent),
  ).toStrictEqual(['0', 'Alice', '25', '1', 'Bob', '30'])
})

test('should handle expressions with spaces', () => {
  const root = document.createElement('div')
  createApp(
    {
      numbers: ref([1, 2, 3, 4, 5, 6]),
    },
    {
      element: root,
      template: html`<div r-for="n in numbers.filter(n => n > 4 )">
        {{ n }}
      </div>`,
    },
  )
  expect(
    [...root.querySelectorAll('div')].map((x) => x.textContent),
  ).toStrictEqual(['5', '6'])
})

test('should render native tbody rows with r-for and react to updates', () => {
  const root = document.createElement('div')
  const app = createApp(
    {
      rows: ref([
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ]),
    },
    {
      element: root,
      template: html`<table>
        <tbody>
          <tr r-for="row in rows">
            <td>{{ row.name }}</td>
            <td>{{ row.age }}</td>
          </tr>
        </tbody>
      </table>`,
    },
  )

  const getRows = () => [...root.querySelectorAll('tbody tr')]
  const getCells = () =>
    [...root.querySelectorAll('tbody td')].map((x) => x.textContent?.trim())

  expect(getRows().length).toBe(2)
  expect(getCells()).toStrictEqual(['Alice', '25', 'Bob', '30'])

  app.context.rows(
    [
      { name: 'Neo', age: 40 },
      { name: 'Trinity', age: 39 },
      { name: 'Morpheus', age: 52 },
    ].map((x) => ref(x)),
  )

  expect(getRows().length).toBe(3)
  expect(getCells()).toStrictEqual([
    'Neo',
    '40',
    'Trinity',
    '39',
    'Morpheus',
    '52',
  ])
})

test('should support nested r-for in native table cells', () => {
  const root = document.createElement('div')
  const app = createApp(
    {
      matrix: ref([[1, 2], [3]]),
    },
    {
      element: root,
      template: html`<table>
        <tbody>
          <tr r-for="row, #ri in matrix">
            <td r-for="cell, #ci in row">{{ ri }}:{{ ci }}={{ cell }}</td>
          </tr>
        </tbody>
      </table>`,
    },
  )

  const getRows = () => [...root.querySelectorAll('tbody tr')]
  const getCells = () =>
    [...root.querySelectorAll('tbody td')].map((x) => x.textContent?.trim())

  expect(getRows().length).toBe(2)
  expect(getCells()).toStrictEqual(['0:0=1', '0:1=2', '1:0=3'])

  app.context.matrix(ref([[], [9, 8]]))

  expect(getRows().length).toBe(2)
  expect(getCells()).toStrictEqual(['1:0=9', '1:1=8'])
})

test('should support native thead and tfoot with r-for', () => {
  const root = document.createElement('div')
  const app = createApp(
    {
      headers: sref(['Name', 'Age']),
      totals: sref(['Total', '55']),
    },
    {
      element: root,
      template: html`<table>
        <thead>
          <tr>
            <th r-for="h in headers">{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Alice</td>
            <td>25</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td r-for="t in totals">{{ t }}</td>
          </tr>
        </tfoot>
      </table>`,
    },
  )

  const getHead = () =>
    [...root.querySelectorAll('thead th')].map((x) => x.textContent?.trim())
  const getFoot = () =>
    [...root.querySelectorAll('tfoot td')].map((x) => x.textContent?.trim())

  expect(getHead()).toStrictEqual(['Name', 'Age'])
  expect(getFoot()).toStrictEqual(['Total', '55'])

  app.context.headers(['Full Name', 'Years'])
  app.context.totals(['Total', '77'])

  expect(getHead()).toStrictEqual(['Full Name', 'Years'])
  expect(getFoot()).toStrictEqual(['Total', '77'])
})

test('should support r-for on table custom row and cell components', () => {
  const root = document.createElement('div')

  const tableCell = createComponent(html`<td><span>{{ value }}</span></td>`, {
    props: ['value'],
  })

  const tableCell2 = createComponent(html`<span>{{ value }}</span>`, {
    props: ['value'],
  })

  const tableRow = createComponent(
    html`<tr>
      <TableCell :value="i" />
      <td><TableCell2 :value="row.name" /></td>
      <TableCell :value="row.age" />
    </tr>`,
    { props: ['row', 'i'] },
  )

  const app = createApp(
    {
      components: {
        tableCell,
        tableCell2,
        tableRow,
      },
      rows: ref([
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ]),
    },
    {
      element: root,
      template: html`<table>
        <tbody>
          <TableRow r-for="row, #i in rows" :row="row" :i="i" />
        </tbody>
      </table>`,
    },
  )
  const getCellText = () =>
    [...root.querySelectorAll('td')].map((x) => x.textContent?.trim())

  expect(getCellText()).toStrictEqual(['0', 'Alice', '25', '1', 'Bob', '30'])

  app.context.rows().push(ref({ name: 'Charlie', age: 22 }))

  expect(getCellText()).toStrictEqual([
    '0',
    'Alice',
    '25',
    '1',
    'Bob',
    '30',
    '2',
    'Charlie',
    '22',
  ])
})

test('should support table usage with th and td as components', () => {
  const root = document.createElement('div')

  const tableHeadCell = createComponent(
    html`<th><span>{{ value }}</span></th>`,
    {
      props: ['value'],
    },
  )
  const tableCell = createComponent(html`<td><span>{{ value }}</span></td>`, {
    props: ['value'],
  })
  const headerRow = createComponent(
    html`<tr>
      <TableHeadCell r-for="label in headers" :value="label" />
    </tr>`,
    { props: ['headers'] },
  )
  const tableRow = createComponent(
    html`<tr>
      <TableCell :value="row.name" />
      <TableCell :value="row.age" />
    </tr>`,
    { props: ['row'] },
  )

  const app = createApp(
    {
      components: {
        tableHeadCell,
        tableCell,
        headerRow,
        tableRow,
      },
      headers: ref(['Name', 'Age']),
      rows: ref([
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ]),
    },
    {
      element: root,
      template: html`<table>
        <tbody>
          <HeaderRow :headers="headers" />
          <TableRow r-for="row in rows" :row="row" />
        </tbody>
      </table>`,
    },
  )

  const getHeadText = () =>
    [...root.querySelectorAll('th')].map((x) => x.textContent?.trim())
  const getCellText = () =>
    [...root.querySelectorAll('td')].map((x) => x.textContent?.trim())

  expect(getHeadText()).toStrictEqual(['Name', 'Age'])
  expect(getCellText()).toStrictEqual(['Alice', '25', 'Bob', '30'])

  app.context.rows().push(ref({ name: 'Charlie', age: 22 }))

  expect(getHeadText()).toStrictEqual(['Name', 'Age'])
  expect(getCellText()).toStrictEqual([
    'Alice',
    '25',
    'Bob',
    '30',
    'Charlie',
    '22',
  ])
})

test('should support table usage with thead th components (expected to fail for now)', () => {
  const root = document.createElement('div')

  const tableHeadCell = createComponent(
    html`<th><span>{{ value }}</span></th>`,
    {
      props: ['value'],
    },
  )
  const tableCell = createComponent(html`<td><span>{{ value }}</span></td>`, {
    props: ['value'],
  })
  const headerRow = createComponent(
    html`<tr>
      <TableHeadCell r-for="label in headers" :value="label" />
    </tr>`,
    { props: ['headers'] },
  )
  const tableRow = createComponent(
    html`<tr>
      <TableCell :value="row.name" />
      <TableCell :value="row.age" />
    </tr>`,
    { props: ['row'] },
  )

  createApp(
    {
      components: {
        tableHeadCell,
        tableCell,
        headerRow,
        tableRow,
      },
      headers: ref(['Name', 'Age']),
      rows: ref([
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ]),
    },
    {
      element: root,
      template: html`<table>
        <thead>
          <HeaderRow :headers="headers" />
        </thead>
        <tbody>
          <TableRow r-for="row in rows" :row="row" />
        </tbody>
      </table>`,
    },
  )

  const getHeadText = () =>
    [...root.querySelectorAll('th')].map((x) => x.textContent?.trim())
  const getCellText = () =>
    [...root.querySelectorAll('td')].map((x) => x.textContent?.trim())

  expect(getHeadText()).toStrictEqual(['Name', 'Age'])
  expect(getCellText()).toStrictEqual(['Alice', '25', 'Bob', '30'])
})

test('should support simple table usage without thead/tbody (expected to fail for now)', () => {
  const root = document.createElement('div')

  const tableHeadCell = createComponent(
    html`<th><span>{{ value }}</span></th>`,
    {
      props: ['value'],
    },
  )
  const tableCell = createComponent(html`<td><span>{{ value }}</span></td>`, {
    props: ['value'],
  })
  const headerRow = createComponent(
    html`<tr>
      <TableHeadCell r-for="label in headers" :value="label" />
    </tr>`,
    { props: ['headers'] },
  )
  const tableRow = createComponent(
    html`<tr>
      <TableCell :value="row.name" />
      <TableCell :value="row.age" />
    </tr>`,
    { props: ['row'] },
  )

  createApp(
    {
      components: {
        tableHeadCell,
        tableCell,
        headerRow,
        tableRow,
      },
      headers: ref(['Name', 'Age']),
      rows: ref([
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ]),
    },
    {
      element: root,
      template: html`<table>
        <HeaderRow :headers="headers" />
        <TableRow r-for="row in rows" :row="row" />
      </table>`,
    },
  )

  const getHeadText = () =>
    [...root.querySelectorAll('th')].map((x) => x.textContent?.trim())
  const getCellText = () =>
    [...root.querySelectorAll('td')].map((x) => x.textContent?.trim())

  expect(getHeadText()).toStrictEqual(['Name', 'Age'])
  expect(getCellText()).toStrictEqual(['Alice', '25', 'Bob', '30'])
})

test('should support table usage with tfoot and component cells', () => {
  const root = document.createElement('div')

  const tableCell = createComponent(html`<td><span>{{ value }}</span></td>`, {
    props: ['value'],
  })
  const footerRow = createComponent(
    html`<tr>
      <TableCell r-for="value in totals" :value="value" />
    </tr>`,
    { props: ['totals'] },
  )

  createApp(
    {
      components: {
        tableCell,
        footerRow,
      },
      totals: ref(['Total', '55']),
    },
    {
      element: root,
      template: html`<table>
        <tfoot>
          <FooterRow :totals="totals" />
        </tfoot>
      </table>`,
    },
  )

  const getCellText = () =>
    [...root.querySelectorAll('tfoot td')].map((x) => x.textContent?.trim())

  expect(getCellText()).toStrictEqual(['Total', '55'])
})

test('should not throw when adding first tenant after selectedHost replacement', () => {
  const root = document.createElement('div')
  const hostItems = ref([
    { hostname: 'host-a', tenants: ['a-1'] },
    { hostname: 'host-b', tenants: [] },
  ])
  const selectedHost = ref(hostItems()[0]())

  const addTenant = (): void => {
    const tenants = selectedHost().tenants()
    tenants.push(ref(`tenant-${tenants.length + 1}`))
  }
  const removeTenant = (tenantValue: any): void => {
    const tenants = selectedHost().tenants()
    const index = tenants.findIndex((x: any) => x === tenantValue)
    if (index >= 0) tenants.splice(index, 1)
  }

  createApp(
    {
      hostItems,
      selectedHost,
      addTenant,
      removeTenant,
    },
    {
      element: root,
      template: html`<div class="form-block__field">
        <span class="form-block__label">Tenants</span>
        <div
          class="form-block__meta"
          r-for="tenantValue in selectedHost.tenants"
        >
          <input class="form-block__input" type="text" r-model="tenantValue" />
          <button type="button" @click="removeTenant(tenantValue)">
            Remove
          </button>
        </div>
        <button type="button" @click="addTenant">Add tenant</button>
      </div>`,
    },
  )

  const getTenantInputs = () =>
    root.querySelectorAll(
      'input.form-block__input',
    ) as NodeListOf<HTMLInputElement>

  expect(getTenantInputs().length).toBe(1)
  selectedHost(hostItems()[1]())
  expect(getTenantInputs().length).toBe(0)

  expect(() => addTenant()).not.toThrow()
  expect(getTenantInputs().length).toBe(1)
  expect(getTenantInputs()[0].value).toBe('tenant-1')

  expect(() => addTenant()).not.toThrow()
  expect(getTenantInputs().length).toBe(2)
})

test('should start from selected host tenants when adding first tenant via component prop after replacement', () => {
  const root = document.createElement('div')
  const hostItems = ref([
    { hostname: 'host-a', tenants: ['a-1'] },
    { hostname: 'host-b', tenants: [] },
  ])
  const selectedHost = ref(hostItems()[0]())

  const hostTenantsField = createComponent(
    html`<div class="form-block__field">
      <span class="form-block__label">Tenants</span>
      <div class="form-block__meta" r-for="tenantValue in selectedHost.tenants">
        <input class="form-block__input" type="text" r-model="tenantValue" />
        <button type="button" @click="removeTenant(tenantValue)">Remove</button>
      </div>
      <button type="button" @click="addTenant">Add tenant</button>
    </div>`,
    {
      props: ['selectedHost'],
      context: () => {
        const ctx: Record<string, any> = {}
        const getTenants = (): any[] => {
          const host = unref(ctx.selectedHost)
          return unref(host.tenants)
        }
        ctx.addTenant = () => {
          const tenants = getTenants()
          tenants.push(ref(`tenant-${tenants.length + 1}`))
        }
        ctx.removeTenant = (tenantValue: any) => {
          const tenants = getTenants()
          const index = tenants.findIndex((x: any) => x === tenantValue)
          if (index >= 0) tenants.splice(index, 1)
        }
        return ctx
      },
    },
  )

  createApp(
    {
      hostItems,
      selectedHost,
      components: {
        hostTenantsField,
      },
    },
    {
      element: root,
      template: html`<HostTenantsField
        :selectedHost="selectedHost"
      ></HostTenantsField>`,
    },
  )

  const getTenantInputs = () =>
    root.querySelectorAll(
      'input.form-block__input',
    ) as NodeListOf<HTMLInputElement>
  const getAddButton = () =>
    [...root.querySelectorAll('button')].find(
      (x) => x.textContent === 'Add tenant',
    ) as HTMLButtonElement | undefined

  expect(getTenantInputs().length).toBe(1)
  selectedHost(hostItems()[1]())

  const addButton = getAddButton()
  if (!addButton) throw new Error('missing add button')

  expect(() => addButton.click()).not.toThrow()
  const valuesAfterFirstAdd = [...getTenantInputs()].map((x) => x.value)
  expect(valuesAfterFirstAdd).toStrictEqual(['tenant-1'])
})

test('repro with hosts-like component hierarchy and table selection path', async () => {
  const root = document.createElement('div')

  const hosts = ref<any[]>([])
  const selectedHost = ref({
    hostname: '',
    hostId: 0,
    tenants: ['0'],
    googleAuth: { clientId: '', clientSecret: '', scopes: ['openid'] },
    staticRoutes: [{ prefix: '/', directory: '/tmp' }],
  })

  const selectHost = (hostname: string): void => {
    const host = hosts().find((item) => item().hostname() === hostname)
    if (!host) return
    selectedHost(host)
  }

  const refreshHosts = async (): Promise<void> => {
    await Promise.resolve()
    hosts(
      [
        {
          hostname: 'host-a',
          hostId: 1,
          tenants: ['a-1'],
          googleAuth: { clientId: 'a', clientSecret: 'a', scopes: ['openid'] },
          staticRoutes: [{ prefix: '/', directory: '/a' }],
        },
        {
          hostname: 'host-b',
          hostId: 2,
          tenants: [],
          googleAuth: { clientId: 'b', clientSecret: 'b', scopes: ['openid'] },
          staticRoutes: [{ prefix: '/', directory: '/b' }],
        },
      ].map((x) => ref(x)),
    )
    selectHost('host-a')
  }

  const hostInputField = createComponent(
    html`<input type="text" r-model="model" />`,
    ['model'],
  )

  const hostTenantsField = createComponent(
    html`<div>
      <div class="tenant-row" r-for="tenantValue in selectedHost.tenants">
        <input type="text" r-model="tenantValue" />
      </div>
      <button type="button" @click="addTenant">Add tenant</button>
    </div>`,
  )

  const hostEditor = createComponent(
    html`<div>
      <HostInputField :model="selectedHost.hostname"></HostInputField>
      <HostTenantsField></HostTenantsField>
    </div>`,
    {
      context: () => ({
        selectedHost,
        addTenant: () => {
          selectedHost().tenants([...selectedHost().tenants(), ref('')])
        },
      }),
    },
  )

  const hostTableRow = createComponent(
    html`<tr @click="selectHost(host.hostname)">
      <td>{{ host.hostname }}</td>
      <td>
        <span r-for="tenantValue in host.tenants">{{ tenantValue }}</span>
      </td>
    </tr>`,
    {
      props: ['host'],
      context: () => ({
        selectHost,
      }),
    },
  )

  const hostsClientApp = createComponent(
    html`<section>
      <table>
        <tbody>
          <HostTableRow r-for="host in hosts" :host="host"></HostTableRow>
        </tbody>
      </table>
      <HostEditor></HostEditor>
    </section>`,
    {
      context: () => ({
        hosts,
      }),
    },
  )

  createApp(
    {
      hosts,
      selectedHost,
      components: {
        hostsClientApp,
        hostEditor,
        hostInputField,
        hostTenantsField,
        hostTableRow,
      } as unknown as Record<string, Component>,
    },
    {
      element: root,
      template: html`<HostsClientApp></HostsClientApp>`,
    },
  )

  await refreshHosts()

  const hostRows = root.querySelectorAll('tbody tr')
  if (hostRows.length < 2) throw new Error('missing host rows')
  ;(hostRows[1] as HTMLTableRowElement).click()

  const addButton = [...root.querySelectorAll('button')].find(
    (x) => x.textContent === 'Add tenant',
  ) as HTMLButtonElement | undefined
  if (!addButton) throw new Error('missing add button')

  expect(() => addButton.click()).not.toThrow()
  const tenantInputs = root.querySelectorAll('.tenant-row input')
  expect(tenantInputs.length).toBe(1)
})
