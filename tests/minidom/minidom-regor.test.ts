import { describe, expect, it } from 'vitest'

import { createApp, createComponent, html } from '../../src'
import { createDom } from './createDom'

function withDom<T>(markup: string, run: () => T): T {
  const cleanup = createDom(markup)
  try {
    return run()
  } finally {
    cleanup()
  }
}

function mountTemplate(template: string, document: Document) {
  const component = createComponent(html`${template}`)
  const wrapper = document.createElement('div')
  wrapper.appendChild(component.template.cloneNode(true))
  return wrapper
}

describe('regor + minidom compatibility', () => {
  it('interpolates simple text nodes into r-text bindings', () =>
    withDom('<html><body></body></html>', () => {
      const wrapper = mountTemplate(
        '<div><span>{{ title }}</span></div>',
        document,
      )
      const span = wrapper.querySelector('span')
      expect(span?.getAttribute('r-text')).toBe(' title ')
      expect(span?.textContent).toBe('')
    }))

  it('interpolates inside template.content', () =>
    withDom('<html><body></body></html>', () => {
      const wrapper = mountTemplate(
        '<div><template #content><span>{{ item.title }}</span></template></div>',
        document,
      )
      const template = wrapper.querySelector('template')
      const contentSpan = template?.content?.firstElementChild
      expect(contentSpan?.getAttribute('r-text')).toBe(' item.title ')
      expect(contentSpan?.textContent).toBe('')
    }))

  it('handles mixed text + interpolation', () =>
    withDom('<html><body></body></html>', () => {
      const wrapper = mountTemplate('<p>Hello {{ name }}!</p>', document)
      const span = wrapper.querySelector('p span')
      expect(span?.getAttribute('r-text')).toBe(' name ')
      expect(wrapper.querySelector('p')?.textContent).toBe('Hello !')
    }))

  it('skips interpolation under r-pre', () =>
    withDom('<html><body></body></html>', () => {
      const wrapper = mountTemplate(
        '<div r-pre><span>{{ skip }}</span></div>',
        document,
      )
      const span = wrapper.querySelector('span')
      expect(span?.getAttribute('r-text')).toBeNull()
      expect(span?.textContent).toBe('{{ skip }}')
    }))

  it('supports nested templates inside template.content', () =>
    withDom('<html><body></body></html>', () => {
      const wrapper = mountTemplate(
        '<template><template><span>{{ x }}</span></template></template>',
        document,
      )
      const outer = wrapper.querySelector<HTMLTemplateElement>('template')
      const inner = outer?.content?.querySelector?.('template')
      const span = inner?.content?.firstElementChild
      expect(span?.getAttribute('r-text')).toBe(' x ')
    }))

  it('exposes template.content in minidom', () =>
    withDom(
      '<html><body><template><span>x</span></template></body></html>',
      () => {
        const template = document.querySelector('template')
        expect(template?.content).toBeTruthy()
        expect(template?.content?.childNodes.length).toBe(1)
      },
    ))

  it('teleports component root to target element via r-teleport directive', () =>
    withDom(
      '<html><body><div id="app"><TeleportProbe></TeleportProbe><div id="teleport-host"></div></div></body></html>',
      () => {
        const appRoot = document.querySelector('#app')
        if (!appRoot) throw new Error('missing #app root')
        const teleportHost = document.querySelector('#teleport-host')
        if (!teleportHost) throw new Error('missing #teleport-host')

        const teleportProbe = createComponent(
          html`<section class="teleport-probe" r-teleport="#teleport-host">
            <span>Teleported payload</span>
          </section>`,
        )

        createApp(
          {
            components: {
              teleportProbe,
            },
          },
          {
            element: appRoot,
          },
        )

        const appHtml = appRoot.innerHTML
        const hostHtml = teleportHost.innerHTML
        expect(hostHtml).toContain('teleport-probe')
        expect(hostHtml).toContain('Teleported payload')
        expect(appHtml).toContain("teleported => '#teleport-host'")
        const [beforeHost = ''] = appHtml.split('<div id="teleport-host">')
        expect(beforeHost).not.toContain('teleport-probe')
      },
    ))

  it('applies :style object bindings to inline style attributes', () =>
    withDom(
      '<html><body><div id="app"><StyleProbe></StyleProbe></div></body></html>',
      () => {
        const appRoot = document.querySelector('#app')
        if (!appRoot) throw new Error('missing #app root')

        const styleProbe = createComponent(
          html`<p
            class="probe"
            :style="{ fontSize: '18px', lineHeight: '1.4' }"
          >
            Styled payload
          </p>`,
        )

        createApp(
          {
            components: {
              styleProbe,
            },
          },
          {
            element: appRoot,
          },
        )

        const probe = appRoot.querySelector('.probe')
        const style = probe?.getAttribute('style') ?? ''
        expect(style).toContain('font-size: 18px')
        expect(style).toContain('line-height: 1.4')
      },
    ))

  it('renders default and named slots (abc + extra) without selector mis-resolution', () =>
    withDom(
      '<html><body><div id="app"><ShellComponent></ShellComponent></div></body></html>',
      () => {
        const appRoot = document.querySelector('#app')
        if (!appRoot) throw new Error('missing #app root')

        const shellComponent = createComponent(
          html`<section>
            <slot></slot>
            <slot name="abc"></slot>
            <slot name="extra"></slot>
          </section>`,
          {
            context: (head) => {
              head.enableSwitch = true
              return {}
            },
          },
        )

        createApp(
          {
            message: 'hello',
            extra: 'x',
            components: { shellComponent },
          },
          {
            element: appRoot,
            template: html`<ShellComponent>
              <p class="message">default slot {{ message }}</p>
              <template name="abc"
                ><p class="message">{{ message }}</p></template
              >
              <template name="extra"
                ><em class="extra">{{ extra }}</em></template
              >
            </ShellComponent>`,
          },
        )

        const messages = [
          ...appRoot.querySelectorAll<HTMLElement>('.message'),
        ].map((x) => x.textContent?.trim())
        expect(messages).toContain('default slot hello')
        expect(messages).toContain('hello')
        expect(appRoot.querySelector('.extra')?.textContent).toBe('x')
      },
    ))
})
