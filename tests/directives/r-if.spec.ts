import { expect, test } from 'vitest'

import { Component, createApp, createComponent, html, ref } from '../../src'

test('r-if/r-else toggles after selectedHost replacement without component', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })

  createApp(
    { selectedHost },
    {
      element: root,
      template: html`<div r-if="selectedHost.hostname === 'alpha'">alpha</div>
        <div r-else>other</div>`,
    },
  )

  expect(root.textContent?.trim()).toBe('alpha')

  selectedHost(ref({ hostname: 'beta' }))
  expect(root.textContent?.trim()).toBe('other')

  selectedHost(ref({ hostname: 'alpha' }))
  expect(root.textContent?.trim()).toBe('alpha')
})

test('r-if/r-else inside component prop tracks selectedHost replacement', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })

  const hostStatusField = createComponent(
    html`<div r-if="selectedHost.hostname === 'alpha'">alpha</div>
      <div r-else>other</div>`,
    ['selectedHost'],
  )

  createApp(
    {
      selectedHost,
      components: {
        hostStatusField,
      },
    },
    {
      element: root,
      template: html`<HostStatusField
        :selectedHost="selectedHost"
      ></HostStatusField>`,
    },
  )

  expect(root.textContent?.trim()).toBe('alpha')

  selectedHost(ref({ hostname: 'beta' }))
  expect(root.textContent?.trim()).toBe('other')

  selectedHost().hostname('alpha')
  expect(root.textContent?.trim()).toBe('alpha')
})

test('r-if/r-else-if/r-else inside component prop tracks selectedHost.tenants length across replacements', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ tenants: ['t1'] })

  const hostTenantStatus = createComponent(
    html`<div r-if="selectedHost.tenants.length > 1">many</div>
      <div r-else-if="selectedHost.tenants.length === 1">one</div>
      <div r-else>none</div>`,
    ['selectedHost'],
  )

  createApp(
    {
      selectedHost,
      components: {
        hostTenantStatus,
      },
    },
    {
      element: root,
      template: html`<HostTenantStatus
        :selectedHost="selectedHost"
      ></HostTenantStatus>`,
    },
  )

  expect(root.textContent?.trim()).toBe('one')

  selectedHost(ref({ tenants: new Array<string>() }))
  expect(root.textContent?.trim()).toBe('none')

  selectedHost(ref({ tenants: ['x', 'y'] }))
  expect(root.textContent?.trim()).toBe('many')
})

test('r-if/r-else propagates through 3 nested components across selectedHost replacements', () => {
  const root = document.createElement('div')
  const selectedHost = ref({ hostname: 'alpha' })

  const leafHostStatus = createComponent(
    html`<div r-if="selectedHost.hostname === 'alpha'">alpha</div>
      <div r-else>other</div>`,
    ['selectedHost'],
  )
  const middleHostStatus = createComponent(
    html`<LeafHostStatus :selectedHost="selectedHost"></LeafHostStatus>`,
    {
      props: ['selectedHost'],
      context: () => ({
        components: {
          leafHostStatus,
        },
      }),
    },
  )
  const outerHostStatus = createComponent(
    html`<MiddleHostStatus :selectedHost="selectedHost"></MiddleHostStatus>`,
    {
      props: ['selectedHost'],
      context: () => ({
        components: {
          middleHostStatus,
        },
      }),
    },
  )

  createApp(
    {
      selectedHost,
      components: {
        outerHostStatus,
      } as unknown as Record<string, Component>,
    },
    {
      element: root,
      template: html`<OuterHostStatus
        :selectedHost="selectedHost"
      ></OuterHostStatus>`,
    },
  )

  expect(root.textContent?.trim()).toBe('alpha')

  selectedHost(ref({ hostname: 'beta' }))
  expect(root.textContent?.trim()).toBe('other')

  selectedHost().hostname('alpha')
  expect(root.textContent?.trim()).toBe('alpha')

  selectedHost(ref({ hostname: 'gamma' }))
  expect(root.textContent?.trim()).toBe('other')
})
