# pagelet

A page builder for React apps. Your users build pages by dragging blocks onto a
canvas, and your site draws the saved pages with the same React components.

- **A visual editor** for admin screens: drag, reorder, edit, undo, and preview
  at phone and desktop widths.
- **A small renderer** for public pages. It has no editor code in it, and it
  works in server-side rendering, so search engines see real HTML.
- **A standard set of blocks**: sections, columns, hero, headings, text,
  quotes, icon lists, schedules, buttons, calls to action, cards, FAQ, images,
  image with text, YouTube/Vimeo video, and (for hosts you allow) embedded pages.
- **Page backgrounds**: a site-wide photo under a panel of any color and
  opacity, which each page can follow, replace or turn off.
- **Your own blocks**: register any React component and it appears in the
  palette beside the built-in ones.
- **Theming** through CSS variables: colors, fonts, corner radius, page width.
- **A site menu and layout**: logo, items with icons and highlights, left and
  right groups, and a menu button on phones, all from site settings.

pagelet is built on [Puck](https://puckeditor.com), an MIT-licensed visual
editor for React. Your app talks only to pagelet, which keeps Puck's upgrades in
one place.

> Not related to the older `pagelet` package on npm from the BigPipe project.

**Status:** early (0.1.x); the API may still change. Two packages:

- `@byscott-io/pagelet` (npm): the editor, renderer and blocks.
- `pagelet` (gem): a Rails engine that stores pages, keeps every published
  version, and serves the editor's API. See [docs/INTEGRATION.md](docs/INTEGRATION.md).

## Install

```sh
yarn add @byscott-io/pagelet react react-dom
```

## Use

**1. Define your palette once**, with any blocks of your own:

```jsx
import { createPalette } from '@byscott-io/pagelet';

const Quote = {
  label: 'Quote',
  category: 'extras',
  fields: { text: { type: 'textarea' }, author: { type: 'text' } },
  render: ({ text, author }) => (
    <blockquote>
      {text}
      <cite>{author}</cite>
    </blockquote>
  ),
};

export const palette = createPalette({
  blocks: { Quote },                         // added beside the built-in blocks
  categories: { extras: { title: 'Extras' } },
  hide: ['Faq'],                             // built-in blocks you don't want
});
```

**2. Edit pages** in your admin screens:

```jsx
import { PageletEditor } from '@byscott-io/pagelet/editor';
import '@byscott-io/pagelet/editor.css';

<PageletEditor
  document={savedDocument}
  palette={palette}
  theme={siteTheme}
  headerTitle="Home page"
  onPublish={(document) => save(document)}
/>;
```

**3. Render pages** on your site:

```jsx
import { PageletPage } from '@byscott-io/pagelet';

<PageletPage document={savedDocument} palette={palette} theme={siteTheme} />;
```

`document` is plain JSON (`{ pagelet: 1, data: {...} }`). Store it as-is; pass
it back to either component. Pages saved by an older pagelet are upgraded when
they load.

**4. With the Rails engine**, the client does the storing:

```jsx
import { createPageletClient } from '@byscott-io/pagelet';

const pages = createPageletClient(); // same origin, mounted at /pagelet

const { page } = await pages.getPage(id);
<PageletEditor
  document={page.draft_document}
  palette={palette}
  onChange={(document) => pages.saveDraft(id, document)}
  onPublish={async (document) => {
    await pages.saveDraft(id, document);
    await pages.publish(id);
  }}
/>;
```

It sends the app's session cookie and the CSRF token from the page's
`csrf-token` meta tag, and throws `PageletApiError` (with `status` and field
`errors`) when the server refuses.

## Theme

Any subset of these tokens; the rest use the defaults:

```js
{
  colorText, colorBackground, colorMuted,
  colorAccent, colorAccentText,
  fontBody, fontHeading, fontSize,   // fontSize: the page's base text size, e.g. '1.25rem'
  radius, maxWidth, space,
}
```

They become CSS variables (`--pagelet-color-accent`, …) on the page wrapper, so
your own blocks can use them too: `color: var(--pagelet-color-accent)`.

A site background goes in the theme too, and each page can follow it, use its
own, or have none (the page's Background setting):

```js
background: {
  image: '/images/building.jpg',
  overlayColor: '#ffffff',
  overlayOpacity: 85,   // percent
  fit: 'photo',         // or 'cover'
  frame: 'card',        // or 'none'
  rounded: true,
}
```

## Writing your own blocks

A block is a [Puck component config](https://puckeditor.com/docs/api-reference/configuration/component-config)
(`fields`, `defaultProps`, `render`) plus an optional `category`.

- **Render on the server.** `render` must not touch `window` or `document`
  while rendering. Add browser-only behavior in an effect.
- **Treat every URL as untrusted.** Pass user-entered links through `safeUrl`
  and images through `safeImageUrl` (both exported); they refuse `javascript:`
  and other unsafe schemes.
- A block with a built-in block's name replaces that block.

## License

MIT. See [LICENSE](LICENSE).
