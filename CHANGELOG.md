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

## 0.0.1 (gem only)
- Placeholder that reserves the name on RubyGems. No functionality.
