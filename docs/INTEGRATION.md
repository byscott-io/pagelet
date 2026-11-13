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

## The gem (Rails engine)

Stores pages, keeps every published version, and serves the editor's API.

1. `gem "pagelet"` in the Gemfile, then `bundle install`.
2. `bin/rails generate pagelet:install`, which writes
   `config/initializers/pagelet.rb`, copies the migrations and mounts the engine
   at `/pagelet`. Then `bin/rails db:migrate`.
3. **Fill in the two required hooks** in the initializer. Until both are set,
   every request raises `Pagelet::ConfigurationError`.

```ruby
Pagelet.configure do |config|
  # Whose pages this request may see. Every query is scoped to it.
  config.owner = ->(controller) { Current.site }

  # :edit covers listing, creating, changing and seeing drafts, and deleting
  # pages that were never published. :publish covers publishing, unpublishing
  # and deleting a live page.
  config.authorize = ->(controller, action, page) do
    user = controller.current_user
    action == :publish ? user&.can_publish? : user&.can_edit?
  end

  config.parent_controller = "ApplicationController"
end
```

**Get the owner hook right; it is the only thing between one site's pages and
another's.** It runs on every request. A page belonging to another owner
answers 404, exactly like a page that does not exist.

### Rendering on the server

```ruby
document = Pagelet::Page.published_document(Current.site, request.path)
# nil when there is no such page or it was never published
```

Hand `document` to `<PageletPage>` (for example as JSON in the page, or
through your server-rendering setup). Drafts never come out of this method.

### Site settings: theme and menu

One record per owner, read by every page:

```ruby
Pagelet::Site.settings_for(owner) # => { "theme" => {...}, "menu" => {...} }
```

`GET /site` returns them to anyone; `PATCH /site` changes them and needs
`:publish`, because a change is live at once. Render them with
`<PageletLayout site={settings}>` around `<PageletPage theme={settings.theme}>`.

### Pages that answer for sub-paths

Set `matches_subpaths: true` on a page and it also serves every path below it:
a `/messages` page serves `/messages/43`. An exact page always wins, then the
longest such prefix. `Page.published_match(owner, path)` returns the document,
the page's own path and the remainder (`"43"`), which an app's own block uses
to decide what to show.

### Sitemaps

`Pagelet::Page.sitemap_entries(owner)` returns `[{ path:, updated_at: }]` for
published pages only.

### The API (mounted at /pagelet)

| Request | Needs | Does |
|---------|-------|------|
| `GET /pages` | `:edit` | list pages |
| `POST /pages` | `:edit` | create (`page: { path, title }`), with an empty draft |
| `GET /pages/:id` | `:edit` | a page and its draft |
| `PATCH /pages/:id` | `:edit` | change `path`, `title` or `draft_document` |
| `DELETE /pages/:id` | `:edit`, or `:publish` if the page is live | delete a page and its history |
| `POST /pages/:id/publish` | `:publish` | publish the draft as the next numbered version |
| `POST /pages/:id/unpublish` | `:publish` | take the page off the site, keeping its draft and versions |
| `GET /pages/:id/versions` | `:edit` | published history, marking the live version |
| `GET /pages/:id/versions/:number` | `:edit` | one version with its document, to preview it |
| `POST /pages/:id/versions/:number/restore` | `:edit` | copy an old version into the draft (publish it to go live) |
| `GET /published?path=/about` | none | the published document (with `page_path` and `rest`), for browser-side rendering |
| `GET /site` | none | the site's theme and menu |
| `PATCH /site` | `:publish` | change them (live at once) |

The engine's controllers inherit from `config.parent_controller`, so the app's
sign-in and CSRF protection apply.

### The npm client

`createPageletClient({ baseUrl })` from `@byscott-io/pagelet` wraps every call
above. It reads the CSRF token from the layout's `csrf_meta_tags` (pass
`csrfToken` to override), sends the session cookie, and throws
`PageletApiError` with `status` and `errors` on failure. `getPublished(path)`
returns `null` for a page that is not published.

`bin/e2e` in this repo runs the built client against the engine with CSRF
protection on; CI runs it on every change.
