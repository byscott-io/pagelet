# Upgrading pagelet in an app

Run from the consuming app. Always bump the gem and the npm package together;
they share one version.

## 0.3.0 to 0.3.1

No migration and no code change.

1. `bundle update pagelet` and `yarn upgrade @byscott-io/pagelet@^0.3.1`.
2. Optional:
   - show `unpublished_changes` from the page list, so admins can see an edit
     that is not live yet
   - preview older versions with `client.getVersion(id, number)`
   - show them in `<PageletEditor readOnly>`

## 0.2.x to 0.3.0

No migration, and nothing changes for an app that does not use the AI tools.

1. `bundle update pagelet` and `yarn upgrade @byscott-io/pagelet@^0.3.0`.
   Note the minor version: a `~> 0.2.x` gem requirement must become `~> 0.3.0`.
2. To offer the AI tools, follow `docs/AI_TOOLS.md`: write the block catalog
   at build time with `paletteCatalog()`, set `config.catalog_path`, and wrap
   `Pagelet::Tools.classes` in your AI library's tool type.

## 0.2.2 to 0.2.3

No migration and no code change.

1. `bundle update pagelet` and `yarn upgrade @byscott-io/pagelet@^0.2.3`.
2. Optional: offer an Unpublish action in your admin. `client.unpublish(id)`
   (`POST /pages/:id/unpublish`, publish permission) takes a page off the site
   and keeps its draft and versions.

## 0.2.1 to 0.2.2

No migration and no code change.

1. `bundle update pagelet` and `yarn upgrade @byscott-io/pagelet@^0.2.2`.
2. Optional: set `fontSize` in the site theme (for example `'1.25rem'`) for
   larger page text. The menu keeps its size. Pages without it are unchanged.

## 0.2.0 to 0.2.1

No migration and no code change for a typical app.

1. `bundle update pagelet` and `yarn upgrade @byscott-io/pagelet@^0.2.1`.
2. **Your public bundle gets smaller.** 0.2.0's renderer pulled in Puck's rich
   text stack (about 350 KB minified); 0.2.1 renders pages itself (about 27 KB).
   Rebuild and check your public bundle size.
3. Only if you call `upgradeDocument` yourself: it no longer takes the palette.

## 0.1.x to 0.2.0

1. Bump both packages: `bundle update pagelet` and
   `yarn upgrade @byscott-io/pagelet@^0.2.0`.
2. **Copy the new migration and run it.** 0.2.0 adds the `pagelet_sites` table
   and `pagelet_pages.matches_subpaths`:
   ```
   bin/rails pagelet:install:migrations
   bin/rails db:migrate
   ```
3. Nothing else is required. Saved pages keep working; the new page settings
   default to the site's background. To use site settings and the menu, see
   docs/INTEGRATION.md.

| error | meaning |
|---|---|
| `PG::UndefinedTable: pagelet_sites` | step 2 was skipped |
| `PATCH /site` answers 403 | site settings need `:publish`, not `:edit` |
