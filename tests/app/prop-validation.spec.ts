import { expect, test, vi } from 'vitest'

import {
  ComponentHead,
  createApp,
  defineComponent,
  html,
  pval,
  type Ref,
  ref,
  RegorConfig,
} from '../../src'
import { warningHandler } from '../../src/log/warnings'

test('component props validation allows validated props to be used during mount', () => {
  const root = document.createElement('div')
  type ValidatedCardProps = {
    title: string
    count?: number
    mode: 'create' | 'edit'
    meta: {
      slug: string
    }
    summary?: string
  }

  const validatedCard = defineComponent<ValidatedCardProps>(
    html`<article class="summary">{{ summary }}</article>`,
    {
      props: ['title', 'count', 'mode', 'meta'],
      context: (head: ComponentHead<ValidatedCardProps>) => {
        head.validateProps({
          title: pval.isString,
          count: pval.optional(pval.isNumber),
          mode: pval.oneOf(['create', 'edit'] as const),
          meta: pval.shape({
            slug: pval.isString,
          }),
        })

        return {
          ...head.props,
          summary: `${head.props.title}:${head.props.mode}:${head.props.meta.slug}:${head.props.count ?? 'none'}`,
        }
      },
    },
  )

  createApp(
    {
      components: { validatedCard },
    },
    {
      element: root,
      template: html`<ValidatedCard
        title="Hello"
        mode="edit"
        :context="{ meta: { slug: 'post-1' } }"
      ></ValidatedCard>`,
    },
  )

  expect(root.querySelector('.summary')?.textContent).toBe(
    'Hello:edit:post-1:none',
  )
})

test('component props validation supports dynamic ref bindings through refOf', () => {
  const root = document.createElement('div')
  type DynamicTitleProps = {
    title: Ref<string>
    summary?: string
  }

  const validatedCard = defineComponent<DynamicTitleProps>(
    html`<article class="summary">{{ summary }}</article>`,
    {
      props: ['title'],
      context: (head: ComponentHead<DynamicTitleProps>) => {
        head.validateProps({
          title: pval.refOf(pval.isString),
        })

        return {
          ...head.props,
          summary: head.props.title(),
        }
      },
    },
  )

  createApp(
    {
      components: { validatedCard },
      title: ref('Hello'),
    },
    {
      element: root,
      template: html`<ValidatedCard :title="title"></ValidatedCard>`,
    },
  )

  expect(root.querySelector('.summary')?.textContent).toBe('Hello')
})

test('component props validation supports or validator during mount', () => {
  const root = document.createElement('div')
  type FlexibleValueProps = {
    value: string | number
    summary?: string
  }

  const flexibleCard = defineComponent<FlexibleValueProps>(
    html`<article class="summary">{{ summary }}</article>`,
    {
      props: ['value'],
      context: (head: ComponentHead<FlexibleValueProps>) => {
        head.validateProps({
          value: pval.or(pval.isString, pval.isNumber),
        })

        return {
          ...head.props,
          summary: String(head.props.value),
        }
      },
    },
  )

  createApp(
    {
      components: { flexibleCard },
    },
    {
      element: root,
      template: html`<FlexibleCard :value="42"></FlexibleCard>`,
    },
  )

  expect(root.querySelector('.summary')?.textContent).toBe('42')
})

test('component props validation throws before invalid component mount completes', () => {
  const root = document.createElement('div')
  type CountProps = {
    count: number
    summary?: string
  }

  const validatedCard = defineComponent<CountProps>(
    html`<article class="summary">{{ summary }}</article>`,
    {
      props: ['count'],
      context: (head: ComponentHead<CountProps>) => {
        head.validateProps({
          count: pval.isNumber,
        })

        return {
          ...head.props,
          summary: String(head.props.count),
        }
      },
    },
  )

  expect(() =>
    createApp(
      {
        components: { validatedCard },
        badCount: ref('oops'),
      },
      {
        element: root,
        template: html`<ValidatedCard :count="badCount"></ValidatedCard>`,
      },
    ),
  ).toThrow(
    'Invalid prop "count" on <validatedcard>: expected number, got ref<string>("oops").',
  )
  expect(root.querySelector('.summary')).toBeNull()
})

test('component props validation warns and continues mount when config mode is warn', () => {
  const root = document.createElement('div')
  const cfg = new RegorConfig()
  cfg.propValidationMode = 'warn'
  const warnSpy = vi
    .spyOn(warningHandler, 'warning')
    .mockImplementation(() => {})

  type CountProps = {
    count: number
    summary?: string
  }

  const validatedCard = defineComponent<CountProps>(
    html`<article class="summary">{{ summary }}</article>`,
    {
      props: ['count'],
      context: (head: ComponentHead<CountProps>) => {
        head.validateProps({
          count: pval.isNumber,
        })

        return {
          ...head.props,
          summary: String(head.props.count),
        }
      },
    },
  )

  try {
    expect(() =>
      createApp(
        {
          components: { validatedCard },
        },
        {
          element: root,
          template: html`<ValidatedCard count="oops"></ValidatedCard>`,
        },
        cfg,
      ),
    ).not.toThrow()
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(String(warnSpy.mock.calls[0][0])).toContain(
      'Invalid prop "count" on <validatedcard>: expected number, got string ("oops").',
    )
    expect(root.querySelector('.summary')?.textContent).toBe('oops')
  } finally {
    warnSpy.mockRestore()
  }
})

test('component props validation can be disabled through config mode off', () => {
  const root = document.createElement('div')
  const cfg = new RegorConfig()
  cfg.propValidationMode = 'off'
  const warnSpy = vi
    .spyOn(warningHandler, 'warning')
    .mockImplementation(() => {})

  type CountProps = {
    count: number
    summary?: string
  }

  const validatedCard = defineComponent<CountProps>(
    html`<article class="summary">{{ summary }}</article>`,
    {
      props: ['count'],
      context: (head: ComponentHead<CountProps>) => {
        head.validateProps({
          count: pval.isNumber,
        })

        return {
          ...head.props,
          summary: String(head.props.count),
        }
      },
    },
  )

  try {
    expect(() =>
      createApp(
        {
          components: { validatedCard },
        },
        {
          element: root,
          template: html`<ValidatedCard count="oops"></ValidatedCard>`,
        },
        cfg,
      ),
    ).not.toThrow()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(root.querySelector('.summary')?.textContent).toBe('oops')
  } finally {
    warnSpy.mockRestore()
  }
})
