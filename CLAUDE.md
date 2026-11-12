# pagelet

A page builder: a visual editor and renderer for React, built on Puck, with a
Rails engine to come for storing and publishing pages. **PUBLIC repo** — never
put a secret, hostname, IP or private-project detail in it; `bin/check-public-safe`
enforces that in CI.

## Ships

| Package | Path | Registry |
|---------|------|----------|
| `@byscott-io/pagelet` (npm) | repo root, `src/` | public npm + GitHub Packages |
| `pagelet` (gem) | repo root, `lib/` | rubygems.org |

One version for both, in `VERSION`.

## Commands

```bash
yarn test     # vitest; renderer tests run in Node with no DOM, on purpose
yarn lint
yarn build    # also fails if the renderer bundle imports the editor
ruby bin/check-public-safe --all
```

## Where the detail lives

| Task | Read |
|------|------|
| Wiring it into an app | [docs/INTEGRATION.md](docs/INTEGRATION.md) |
| Upgrading an app | [docs/UPGRADING.md](docs/UPGRADING.md) |

Behaviour rules are in `.claude/rules/`, not restated here.
