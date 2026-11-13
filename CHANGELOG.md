# Changelog

## Unreleased (0.2.0)

### npm `@byscott-io/pagelet`
- **Page settings** (the page's own fields): a browser title, and a background
  that follows the site's, is custom, or is none, with an overlay color and
  **opacity %**. `pageSettings(document)` returns the title.
- **Site background**, set in the theme: an image, overlay color and opacity,
  `fit` (`cover`, or `photo` to show the whole photo), and `frame` (`none`, or
  `card` for a bordered, rounded, padded frame).
- **New blocks:** Quote (italic text plus a citation), Icon list (icon, text, an
  optional link), Schedule (rows of day / time / what), and Embedded page.
- **Embedded page** is offered only when the app names trusted hosts:
  `createPalette({ embedHosts: ['example.org'] })`. https only, sandboxed.
- **Right alignment** for Text, Heading, Button and the new blocks; Image gains
  alignment and a width %; Section gains a background image with an overlay
  color and opacity.
- A built-in **icon set** (inline SVG): location, phone, email, video, calendar,
  clock, link, Facebook, YouTube. `<Icon name>` is exported.
- **`<PageletMenu>` and `<PageletLayout>`:** a site's menu from its settings
  (a brand logo, items with optional icon and highlight, left and right groups,
  external links in a new tab, a menu button on narrow screens) and the frame
  around a page. Pass your router's link component as `linkComponent`.
- **Client:** `getSite`, `updateSite`, and `getPublishedPage(path)` returning
  `{ document, pagePath, rest }`; `createPage`/`updatePage` take `matchesSubpaths`.

### gem `pagelet`
- **Site settings** per owner (`Pagelet::Site`): the theme and the menu.
  `GET /site` is public; `PATCH /site` needs `:publish`, since changes are live
  at once. Shapes are checked (menu style, labels, links, groups, size).
- **Pages that answer for sub-paths:** `matches_subpaths` on a page makes
  `/messages` serve `/messages/43`. An exact page wins, then the longest such
  prefix. `Page.published_match(owner, path)` returns the document, the page's
  path and the remainder; `GET /published` returns them too.
- **New migration:** run `bin/rails pagelet:install:migrations` and migrate
  (see docs/UPGRADING.md).

## 0.1.0 (2026-11-13)

First release.

### npm `@byscott-io/pagelet`
- `createPalette`: the built-in blocks plus an app's own, with hiding and grouping.
- `PageletPage`: renders a saved page. No editor code; works in server-side rendering.
- `PageletEditor` (from `@byscott-io/pagelet/editor`): the visual editor, built on Puck 0.24.
- Built-in blocks: Section, Columns, Spacer, Divider, Hero, Heading, Text, Button,
  Call to action, Cards, FAQ, Image, Image with text, Video (YouTube/Vimeo).
- Theming through CSS variables.
- Versioned page documents (`{ pagelet: 1, data }`), upgraded when loaded.
- `safeUrl` / `safeImageUrl`: user-entered links and images refuse unsafe schemes.
- `createPageletClient`: the engine's API from the browser, with CSRF and
  `PageletApiError` carrying the server's field errors.

### gem `pagelet` (Rails engine)
- Pages scoped to an owner the app supplies; another owner's page is a 404.
- Drafts, numbered published versions (never edited after publishing), and
  rollback by restoring an old version into the draft.
- JSON API for the editor, behind the app's own `authorize` hook (`:edit`, `:publish`).
- `Page.published_document(owner, path)` for server-side rendering, and
  `Page.sitemap_entries(owner)`. Drafts never reach either.
- Document checks: format version, shape, and a size limit.
- `bin/rails generate pagelet:install`: initializer, migrations, route.

## 0.0.1 (gem only)
- Placeholder that reserves the name on RubyGems. No functionality.
