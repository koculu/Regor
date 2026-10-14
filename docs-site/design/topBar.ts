import { defineTopBarComponents, type TopBar } from '@purestack/ts-components'
import { defineComponent, html } from 'regor'

// Based on PureStack 1.1.7's TopBar template, with navigation before the icons.
const topBarTemplate = html`<input
    class="doc-nav-toggle"
    id="doc-nav-toggle"
    type="checkbox"
    autocomplete="off"
    aria-hidden="true"
  />
  <header class="topbar" :class="classes" r-inherit>
    <Flex align="center">
      <div
        :is="resolvedLogoComponent"
        class="flex-none"
        :config="siteLogo"
      ></div>
      <SearchBox
        r-if="searchEnabled"
        class="topbar__search flex-auto rounded-md tone-text-surface"
        variant="none"
      />
      <Flex class="topbar__controls flex-none" align="center" justify="end">
        <nav class="header-nav" aria-label="Main navigation">
          <a class="header-guide" href="/guide/">Guide</a>
          <a class="header-api" href="/api/">API</a>
        </nav>
        <div class="topbar__actions">
          <ThemeToggle />
          <slot name="actions">
            <a
              class="topbar__icon"
              href="https://github.com/PureStackStudio/Regor"
              aria-label="Regor on GitHub"
              target="_blank"
              rel="noopener"
              ><Icon name="tabler:brand-github"
            /></a>
            <a
              class="topbar__icon"
              href="https://purestack.studio"
              target="_blank"
              rel="noopener"
              aria-label="PureStack Studio website"
            >
              <Icon name="tabler:stack-2" />
            </a>
          </slot>
          <SignIn
            r-if="resolvedSignInEnabled"
            class="topbar__account"
            :enabled="resolvedSignInEnabled"
            :signedIn="signInSignedIn"
            :avatarSrc="signInAvatarSrc"
            :avatarAlt="signInAvatarAlt"
          />
          <label
            class="topbar__icon topbar__toggle"
            for="doc-nav-toggle"
            role="button"
            aria-label="Toggle navigation"
          ></label>
        </div>
      </Flex>
    </Flex>
  </header>`

export function defineRegorTopBar() {
  const original = defineTopBarComponents().topBar
  return defineComponent<TopBar>(topBarTemplate, {
    context: original.context,
    props: original.props,
    inheritAttrs: original.inheritAttrs,
  })
}
