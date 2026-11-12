# pagelet

A page builder: a visual editor and renderer for React, built on Puck, and a
Rails engine that stores, versions and publishes pages. **PUBLIC repo** — never
put a secret, hostname, IP or private-project detail in it; `bin/check-public-safe`
enforces that in CI.

## Ships

| Package | Path | Registry |
|---------|------|----------|
| `@byscott-io/pagelet` (npm) | repo root, `src/` | public npm + GitHub Packages |
| `pagelet` (gem, Rails engine) | repo root, `app/`, `lib/`, `db/` | rubygems.org |

One version for both, in `VERSION`.

## Commands

```bash
yarn test     # vitest; renderer tests run in Node with no DOM, on purpose
yarn lint
yarn build    # also fails if the renderer bundle imports the editor
bundle exec rspec    # against spec/dummy, an in-memory SQLite Rails app
bundle exec rubocop
ruby bin/check-public-safe --all
```

## Where the detail lives

| Task | Read |
|------|------|
| Wiring it into an app | [docs/INTEGRATION.md](docs/INTEGRATION.md) |
| Upgrading an app | [docs/UPGRADING.md](docs/UPGRADING.md) |

Behaviour rules are in `.claude/rules/`, not restated here.
