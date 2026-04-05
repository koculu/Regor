import { expect, test } from 'vitest'

import {
  ComponentHead,
  createApp,
  defineComponent,
  html,
  pval,
  type Ref,
  ref,
} from '../../src'

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
  ).toThrow('Invalid prop "count": expected number.')
  expect(root.querySelector('.summary')).toBeNull()
})
