# AI tools

pagelet ships tools an AI assistant can call to build and change pages: in an
app's own AI chat, or from an assistant connected over MCP. They are plain Ruby
classes with no AI library dependency, so an app wraps them in whatever tool
type its AI stack uses.

## What the tools do

| Tool | Does | Permission |
|---|---|---|
| `pagelet_list_pages` | pages, with status and preview links | `:edit` |
| `pagelet_get_page` | one page's draft | `:edit` |
| `pagelet_list_blocks` | the blocks and fields pages are built from | `:edit` |
| `pagelet_create_page` | a new draft page | `:edit` |
| `pagelet_update_page` | change a draft, title or address | `:edit` |
| `pagelet_publish_page` | put the draft on the site | `:publish`, confirmed |
| `pagelet_unpublish_page` | take a page off the site, keeping history | `:publish`, confirmed |
| `pagelet_delete_page` | delete a page and its history | `:publish` if live, confirmed |
| `pagelet_get_site` | the menu and theme | `:edit` |
| `pagelet_update_site` | change the menu and theme | `:publish`, confirmed |

Drafts are invisible to visitors, so draft changes take one call.

## Confirmed changes

Anything that changes the live site takes two calls:
1. **The first call changes nothing.** It returns a summary and a code.
2. **The model shows the summary** to the person, and only after they agree
   calls again with the code.

The code is bound to the owner, the action, the page and a digest of exactly
what would go live, and it expires after ten minutes. So it cannot publish a
different draft from the one described, or be replayed later.

**It cannot prove that a person agreed.** A model that skips asking can pass
the code straight back. Proof needs a confirmation the person clicks, in the
app's chat UI.

## The block catalog

The server cannot read the JavaScript palette, so the app writes it out as JSON
at build time:

```js
import { writeFileSync } from 'node:fs';
import { paletteCatalog } from '@byscott-io/pagelet';
import { palette } from './pagelet/palette';

writeFileSync('app/assets/builds/pagelet-catalog.json', JSON.stringify(paletteCatalog(palette)));
```

```ruby
# config/initializers/pagelet.rb
config.catalog_path = Rails.root.join("app/assets/builds/pagelet-catalog.json")
```

What the catalog does:
- **It describes your app's own blocks too.** An optional `description` on a
  block is shown to the model, so say what the block is for.
- **Every page a tool writes is checked against it,** and unknown blocks,
  fields or values are refused with what is wrong.
- **Block ids and settings the model leaves out are filled in** from the
  block's defaults.

## Wiring the tools into an app

For each call, build a context from the request, then run the tool:

```ruby
context = Pagelet::Tools::Context.new(
  owner: Current.organization,                              # whose pages
  can: ->(action, page) { current_user.admin_of?(Current.organization) }, # :edit / :publish
  preview_url: ->(page) { "https://#{request.host}/admin/preview/#{page.id}" }
)

Pagelet::Tools.classes.each do |tool|
  tool.tool_name         # "pagelet_publish_page"
  tool.tool_description  # what the model reads
  tool.tool_schema       # JSON Schema of the arguments
  tool.new(context).run(arguments)  # => a Hash; "error" set when refused
end
```

- **Answer `can` the way `config.authorize` answers** for a web request.
- **Never trust an owner or id the model supplies;** the context decides the owner.
