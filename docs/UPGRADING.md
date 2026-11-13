# Upgrading pagelet in an app

Run from the consuming app. Always bump the gem and the npm package together;
they share one version.

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
