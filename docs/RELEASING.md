# Releasing pagelet

The gem and the npm package share one `VERSION` file and release together, to
three registries: RubyGems, public npm, and GitHub Packages.

**A published version can never be changed.** npm renders the README from the
published package and only refreshes it with the next version. So every doc is
final and committed before anything is built or published.

## Steps, in order

1. `rake version:bump[X.Y.Z]`, then `bundle install`. Confirm `VERSION`,
   `package.json` and `Gemfile.lock` (`pagelet (X.Y.Z)`) agree.
2. `CHANGELOG.md`: a dated `## X.Y.Z` entry.
3. README and `docs/`: final for this version, including `docs/UPGRADING.md`
   steps for anything a consuming app must change.
4. All green, then commit to master:
   `bundle exec rspec`, `bundle exec rubocop`, `yarn lint`, `yarn test`,
   `yarn build`, `bin/e2e`, `ruby bin/check-public-safe --all`.
5. **Read the dry runs as a work list, not a receipt.** `npm pack --dry-run`:
   every file in `files` is present (dist, LICENSE, README, CHANGELOG) and there
   are no warnings. The gem's file list is checked in CI, which reruns the suite
   against the built gem.
6. **Verify the artifacts.** Install the packed tarball into a scratch app;
   render a page on the server and load the editor entry and `editor.css`.
7. `bundle exec rake build` puts the gem in `pkg/pagelet-X.Y.Z.gem`. Use
   `rake build`, not `gem build`, which drops the file in the repo root.
8. Publish npm to **public npm**: `npm publish` (`publishConfig.access` is
   `public`, which a scoped package's first publish needs).
9. Publish npm to **GitHub Packages** too. Apps that resolve `@byscott-io`
   from GitHub Packages cannot see a release that only reached public npm.
   ```
   printf '@byscott-io:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}\n' > .npmrc.ghpkg
   npm publish --userconfig .npmrc.ghpkg --registry https://npm.pkg.github.com
   rm .npmrc.ghpkg   # never commit it
   ```
10. Push the gem: `GEM_HOST_API_KEY="$RUBYGEMS_TOKEN" gem push pkg/pagelet-X.Y.Z.gem`.
11. Tag: `git tag -a vX.Y.Z -m "pagelet X.Y.Z" && git push origin vX.Y.Z`.
12. Confirm all three registries show X.Y.Z:
    ```
    curl -s https://rubygems.org/api/v1/versions/pagelet/latest.json
    npm view @byscott-io/pagelet version --registry https://registry.npmjs.org
    npm view @byscott-io/pagelet version --registry https://npm.pkg.github.com
    ```
    Public npm can take a few minutes to show a new version.
