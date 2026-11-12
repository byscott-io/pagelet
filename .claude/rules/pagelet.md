# Working in pagelet

- Two entry points, and the split is the product: `src/index.js` (renderer,
  public pages) must never import the editor. It reaches Puck only through
  `@puckeditor/core/rsc`. `scripts/check-entry-split.js` fails the build
  otherwise; keep it passing and do not weaken it.
- Renderer code runs in server-side rendering. No `window` or `document` in any
  block's render. `PageletPage.test.jsx` runs in Node with no DOM to prove it.
- Every user-entered URL goes through `safeUrl` / `safeImageUrl`. Text is
  rendered as text, never as HTML.
- Stored pages outlive releases. Never rename a built-in block or one of its
  fields; add and fall back instead. A change to the document shape bumps
  `DOCUMENT_VERSION` and adds a migration step in `upgradeDocument`.
- Puck is pinned to a minor version (`~0.24.0`). Upgrade it deliberately, in one
  change, with the editor and renderer tests green.
- One version for gem and npm (`VERSION`); bump both together.
