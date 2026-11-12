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

  # :edit covers listing, creating, changing, deleting and seeing drafts.
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
| `DELETE /pages/:id` | `:edit` | delete a page and its history |
| `POST /pages/:id/publish` | `:publish` | publish the draft as the next numbered version |
| `GET /pages/:id/versions` | `:edit` | published history, marking the live version |
| `POST /pages/:id/versions/:number/restore` | `:edit` | copy an old version into the draft (publish it to go live) |
| `GET /published?path=/about` | none | the published document, for browser-side rendering |

The engine's controllers inherit from `config.parent_controller`, so the app's
sign-in and CSRF protection apply. A browser client must send the CSRF token
the app's layout provides.
