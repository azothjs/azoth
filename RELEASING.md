# Releasing

`azoth`, `@azothjs/maya`, and `@azothjs/thoth` are a changesets **fixed
group** — one release train, all three always at the same version. The
umbrella `azoth` pins the exact matching `@azothjs/*` versions on publish
(pnpm converts the `workspace:*` deps).

## The flow

1. **Author changesets as you land work** (any time, per change):

   ```bash
   pnpm changeset
   ```

   Pick the bump level and write the changelog entry. The fixed group means
   one changeset bumps all three together.

2. **Cut the version** (when ready to release):

   ```bash
   pnpm version        # = changeset version: bumps package.jsons, writes CHANGELOGs
   pnpm install        # refresh the lockfile for the new versions
   git add -A && git commit -m "release: vX.Y.Z"
   ```

3. **Publish** (needs npm auth with rights on `azoth` + the `@azothjs` org —
   check with `npm whoami`):

   ```bash
   pnpm release        # = pnpm -r publish --access public
   ```

   Publishes in dependency order (thoth → maya → azoth); private packages
   (valhalla, test-utils, vite-test) are skipped automatically. Add
   `--dry-run` first to sanity-check.

4. **Tag and push**:

   ```bash
   git tag azoth@X.Y.Z "@azothjs/maya@X.Y.Z" "@azothjs/thoth@X.Y.Z"
   git push && git push --tags
   ```

## Pre-publish checklist

- `pnpm test:CI` green (suite + lint), `pnpm --filter valhalla typecheck`
  clean.
- `pnpm -r publish --dry-run` — eyeball the three tarball listings: README,
  LICENSE, and (azoth) `jsx.d.ts` present; no `*.test.*` files.

## Retired packages

`@azothjs/chronos` and `@azothjs/vite-plugin` are deprecated on the registry
(folded into azoth 2.0 / `@azothjs/thoth/vite`). Don't publish to them.
