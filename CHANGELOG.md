# Changelog

## Unreleased (0.3.1)

- **Unpublished changes.** Page summaries (the page list, the AI tools) include
  `unpublished_changes`: true when a live page's draft differs from what is
  published, so an admin can see that an edit is not live yet.
- **One version's content:** `GET /pages/:id/versions/:number` and
  `client.getVersion(id, number)`, for previewing an older version.
- **`<PageletEditor readOnly>`** shows a page without letting it change (Puck's
  permissions all off, no Publish, no onChange). For older versions: only the
  draft is edited, and an old version comes back by restoring it into the draft.

## 0.3.0 (2026-11-13)

- **AI tools** (`docs/AI_TOOLS.md`): ten plain-Ruby tools that let an AI
  assistant list, read, create and change pages, and publish, unpublish or
  delete them. Changes that reach the live site take a confirmation code bound
  to exactly that change.
- **`paletteCatalog(palette)`** (npm) writes the palette's blocks and fields as
  JSON. `Pagelet::Catalog` (gem) checks pages against it and fills in what was
  left out. `config.catalog_path` says where it is.
- A block may have a `description`, shown to AI tools.

## 0.2.3 (2026-11-13)

- **Unpublish.** `POST /pages/:id/unpublish` (publish permission) and
  `client.unpublish(id)` take a page off the site while keeping its draft and
  every published version, so publishing again brings it back. Before, the only
  way to take a page down was to delete it, history and all.

## 0.2.2 (2026-11-13)

- **Theme `fontSize`**: the page's base text size (default `1rem`), as
  `--pagelet-font-size`. It applies to the page, not the menu, so a site can
  use larger body text without a larger menu. The Hero subheading is now sized
  in `em` so it scales with it.

## 0.2.1 (2026-11-13)

- **The public renderer no longer imports Puck.** 0.2.0's `PageletPage` used
  `@puckeditor/core/rsc`, which pulls in Tiptap and ProseMirror: about 350 KB
  minified on every public page. pagelet now draws pages with its own renderer
  (`src/render.jsx`), which produces byte-for-byte the same HTML as Puck's (a
  test holds it to that). The renderer bundle is now about 27 KB minified.
- The build fails if the renderer imports Puck or exceeds a size budget.
- **Older Puck data with DropZones renders correctly.** A block that draws
  `puck.renderDropZone({ zone })` gets its blocks from `data.zones`, exactly as
  Puck's renderer does (held to Puck's HTML by a test). 0.2.0 ran Puck's
  `migrate()` on public pages, which throws for such a block.
- The editor converts zones to slots with Puck's `migrate()` when the block
  now has a matching slot field, and opens the data unchanged when it does not
  (`migrate()` throws there), instead of crashing.
- `upgradeDocument(document)` no longer takes the palette.

## 0.2.0 (2026-11-13)

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
- The menu's brand link is a plain anchor for `tel:`/`mailto:` (like menu
  items), never passed to the app's router.
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
