# Changelog

## Unreleased (0.1.0)

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
