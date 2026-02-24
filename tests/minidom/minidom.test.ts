import { describe, expect, it } from 'vitest'

import { createDom } from './createDom'
import cssEscape from './cssEscape'
import { parseFragment } from './minidom'

type DomEnv = {
  document: Document
  window: Window
}

function withDom<T>(markup: string, run: (env: DomEnv) => T): T {
  const cleanup = createDom(markup)
  try {
    return run({ document, window })
  } finally {
    cleanup()
  }
}

describe('minidom entity decoding', () => {
  it('decodes numeric entities without double-escaping', () =>
    withDom(
      '<html><body><p>&#x3C;code&#x3E; &amp; &#60;</p></body></html>',
      ({ document }) => {
        expect(document.body?.innerHTML).toBe('<p>&lt;code&gt; &amp; &lt;</p>')
      },
    ))
})

describe('minidom selectors', () => {
  it('returns the first match in document order', () =>
    withDom(
      '<html><body><div><span id="a"></span><span id="b"></span></div></body></html>',
      ({ document }) => {
        expect(document.querySelector('span')?.getAttribute('id')).toBe('a')
      },
    ))

  it('supports child and descendant combinators', () =>
    withDom(
      '<html><body><div id="root"><span id="inner"></span></div><span id="outer"></span></body></html>',
      ({ document }) => {
        expect(document.querySelector('div > span')?.getAttribute('id')).toBe(
          'inner',
        )
        expect(document.querySelector('div span')?.getAttribute('id')).toBe(
          'inner',
        )
      },
    ))

  it('supports :not() with simple selectors', () =>
    withDom(
      '<html><body><span class="skip"></span><span class="keep"></span></body></html>',
      ({ document }) => {
        const matches = document.querySelectorAll('span:not(.skip)')
        expect([...matches].map((el) => el.getAttribute('class'))).toEqual([
          'keep',
        ])
      },
    ))

  it('supports :not() with attribute and id selectors', () =>
    withDom(
      '<html><body><div id="a" data-kind="x"></div><div id="b"></div><div id="c" data-kind="y"></div></body></html>',
      ({ document }) => {
        const matches = document.querySelectorAll(
          'div:not([data-kind="x"]):not(#c)',
        )
        expect([...matches].map((el) => el.getAttribute('id'))).toEqual(['b'])
      },
    ))

  it('does not match sibling combinators that are unsupported', () =>
    withDom(
      '<html><body><div id="a"></div><div id="b"></div></body></html>',
      ({ document }) => {
        expect(document.querySelector('div + div')).toBeNull()
        expect(document.querySelector('div ~ div')).toBeNull()
      },
    ))

  it('returns unique matches for selector lists', () =>
    withDom(
      '<html><body><span class="x" id="a"></span><span class="x" id="b"></span></body></html>',
      ({ document }) => {
        const matches = document.querySelectorAll('span, .x')
        expect([...matches].map((el) => el.getAttribute('id'))).toEqual([
          'a',
          'b',
        ])
      },
    ))

  it('supports CSS.escape output in attribute-name selectors', () =>
    withDom(
      '<html><body><img :src="a.png"><img src="b.png"></body></html>',
      ({ document }) => {
        const selector = `[${cssEscape(':src')}]`
        const matches = document.querySelectorAll(selector)
        expect(matches).toHaveLength(1)
        expect(matches[0]?.getAttribute(':src')).toBe('a.png')
      },
    ))
})

describe('minidom templates', () => {
  it('propagates ownerDocument into template content', () =>
    withDom(
      '<html><body><template><span>hi</span></template></body></html>',
      ({ document }) => {
        const template = document.querySelector('template')
        const span = template?.content?.firstChild
        expect(span?.ownerDocument).toBe(document)
      },
    ))

  it('clones template content deeply', () =>
    withDom(
      '<html><body><template><div><span>ok</span></div></template></body></html>',
      ({ document }) => {
        const template = document.querySelector('template')
        const clone = template?.cloneNode(true) as HTMLTemplateElement
        const span = clone?.content.querySelector('span')
        expect(span?.textContent).toBe('ok')
        expect(span?.ownerDocument).toBe(document)
      },
    ))
})

describe('minidom parsing and serialization', () => {
  it('keeps raw text in script and style nodes', () =>
    withDom(
      '<html><body><script>if (a < b && c > d) { x = "&lt;raw&gt;" }</script></body></html>',
      ({ document }) => {
        const script = document.querySelector('script')
        expect(script?.textContent).toBe(
          'if (a < b && c > d) { x = "&lt;raw&gt;" }',
        )
        expect(script?.outerHTML).toContain('x = "&lt;raw&gt;"')
      },
    ))

  it('parses document fragments and preserves insertion order', () =>
    withDom(
      '<html><body><div id="root"></div></body></html>',
      ({ document }) => {
        const root = document.querySelector('#root')
        const fragment = parseFragment(
          '<span id="a"></span><span id="b"></span>',
          document,
        )
        root?.appendChild(fragment)
        expect(
          [...(root?.querySelectorAll('span') ?? [])].map((el) =>
            el.getAttribute('id'),
          ),
        ).toEqual(['a', 'b'])
      },
    ))

  it('supports replaceWith and replaceChildren', () =>
    withDom(
      '<html><body><div><i id="old"></i></div></body></html>',
      ({ document }) => {
        const old = document.querySelector('#old')
        const first = document.createElement('b')
        first.setAttribute('id', 'new-a')
        const second = document.createElement('b')
        second.setAttribute('id', 'new-b')
        old?.replaceWith(first, second)
        const div = document.querySelector('div')
        expect(
          [...(div?.querySelectorAll('b') ?? [])].map((el) =>
            el.getAttribute('id'),
          ),
        ).toEqual(['new-a', 'new-b'])
        div?.replaceChildren(document.createTextNode('done'))
        expect(div?.textContent).toBe('done')
      },
    ))

  it('treats unquoted attributes before /> as self-closing', () =>
    withDom('<html><body><div data-x=test/></body></html>', ({ document }) => {
      const div = document.querySelector('div')
      expect(div?.getAttribute('data-x')).toBe('test')
      expect(div?.childNodes.length).toBe(0)
    }))

  it('does not throw on invalid numeric entities', () =>
    withDom(
      '<html><body><p>&#x110000; and &#99999999;</p></body></html>',
      ({ document }) => {
        expect(document.querySelector('p')?.textContent).toBe(
          '\uFFFD and \uFFFD',
        )
      },
    ))

  it('synchronizes style attribute into the style declaration', () =>
    withDom(
      '<html><body><div style="font-size: 20px; line-height: 1.4"></div></body></html>',
      ({ document }) => {
        const div = document.querySelector('div')
        expect(div?.style.fontSize).toBe('20px')
        expect(div?.style.lineHeight).toBe('1.4')
        expect(div?.style.getPropertyValue('font-size')).toBe('20px')
        expect(div?.getAttribute('style')).toContain('font-size: 20px')
        expect(div?.getAttribute('style')).toContain('line-height: 1.4')
      },
    ))

  it('preserves custom CSS properties in style attributes', () =>
    withDom(
      '<html><body><span style="--shiki-light:#D73A49;--shiki-dark:#F97583">x</span></body></html>',
      ({ document }) => {
        const span = document.querySelector('span')
        expect(span?.style.getPropertyValue('--shiki-light')).toBe('#D73A49')
        expect(span?.style.getPropertyValue('--shiki-dark')).toBe('#F97583')
        expect(span?.getAttribute('style')).toContain('--shiki-light: #D73A49')
        expect(span?.getAttribute('style')).toContain('--shiki-dark: #F97583')
      },
    ))

  it('serializes style declaration updates back into style attribute', () =>
    withDom('<html><body><div></div></body></html>', () => {
      const div = document.querySelector('div')
      if (!div) throw new Error('missing div')
      div.style.fontSize = '22px'
      div.style.setProperty('line-height', '1.5')

      const style = div.getAttribute('style') ?? ''
      expect(style).toContain('font-size: 22px')
      expect(style).toContain('line-height: 1.5')
      expect(div.outerHTML).toContain('style="')
    }))

  it('removes style attribute when style declaration becomes empty', () =>
    withDom(
      '<html><body><div style="color: red"></div></body></html>',
      ({ document }) => {
        const div = document.querySelector('div')
        if (!div) throw new Error('missing div')
        div.style.removeProperty('color')
        expect(div.getAttribute('style')).toBeNull()
      },
    ))
})

describe('minidom cloning and tree safety', () => {
  it('preserves HTMLElement type when cloning regular elements', () =>
    withDom('<html><body><div></div></body></html>', () => {
      const div = document.querySelector('div')
      const clone = div?.cloneNode(false)
      expect(clone instanceof HTMLElement).toBe(true)
    }))

  it('throws when creating a parent-child cycle', () =>
    withDom(
      '<html><body><div id="a"><span id="b"></span></div></body></html>',
      ({ document }) => {
        const div = document.querySelector('#a')
        const span = document.querySelector('#b')
        expect(() => span?.appendChild(div as never)).toThrow(
          'Cannot insert an ancestor into its descendant',
        )
      },
    ))

  it('throws when insertBefore reference is not a child of parent', () =>
    withDom(
      '<html><body><div id="a"><span id="x"></span></div><div id="b"><i id="y"></i></div></body></html>',
      ({ document }) => {
        const a = document.querySelector('#a')
        const y = document.querySelector('#y')
        const probe = document.createElement('em')
        expect(() => a?.insertBefore(probe, y)).toThrow(
          'Reference node is not a child of this parent',
        )
      },
    ))
})
