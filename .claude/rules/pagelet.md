# Working in pagelet

- Two entry points, and the split is the product: `src/index.js` (renderer,
  public pages) must not import Puck AT ALL. Even `@puckeditor/core/rsc` pulls in
  Tiptap and ProseMirror (about 350 KB minified), and 0.2.0 shipped that to
  public pages because the old check only looked at which Puck entry was
  imported. `scripts/check-entry-split.js` now fails the build on any Puck
  import and on a minified size over budget; keep it passing, do not weaken it.
- The renderer (`src/render.jsx`) must draw exactly what Puck's Render would.
  `render.parity.test.jsx` compares the two byte for byte; when Puck changes how
  it renders, change ours to match rather than loosening the test.
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
- Every engine query goes through `pages` (scoped to `pagelet_owner`), never
  `Page.all` or a bare `Page.find`. Another owner's page must answer 404. The
  request specs prove it; keep them failing if scoping breaks.
- Published versions are append-only. Rollback restores into the draft; it
  never rewrites or deletes history. The only way history goes is deleting the
  whole page, and deleting a live page needs :publish, not :edit.
- `published_document` and the public endpoint serve published versions only.
  Nothing a visitor can reach returns a draft.
