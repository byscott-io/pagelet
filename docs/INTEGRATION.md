# Integrating pagelet into an app

## The npm package

1. `yarn add @byscott-io/pagelet` (React 18 or 19 is a peer dependency).
2. Define one palette for the app (`createPalette`), in a module both the admin
   and the public site import. The same palette must render a page that edited
   it: a block missing from the palette renders nothing.
3. Admin screens: `PageletEditor` from `@byscott-io/pagelet/editor`, plus
   `import '@byscott-io/pagelet/editor.css'`. Never import the editor from a
   public page; it carries the whole editor.
4. Public pages: `PageletPage` from `@byscott-io/pagelet`.
5. Store the document `onPublish` hands you, unchanged.

**Do not import `@puckeditor/core` in the app.** pagelet pins Puck and absorbs
its changes; an app importing Puck directly can end up on a second copy.

## Decisions that are expensive to change later

- **Block names are stored in every saved page.** Renaming a block orphans every
  page that used it. Pick names once.
- **A block's field names are stored too.** Rename a field and old pages lose
  that value. Add a new field instead and fall back to the old one in `render`.

## The gem

Not yet available: storage, versioning and publishing arrive in the Rails
engine. Until then the app stores documents itself.
