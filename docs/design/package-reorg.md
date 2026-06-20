# Package reorg — plan (step 3)

Current packages (8): `azoth` · `maya` · `thoth` · `vite-plugin` · `dom-info` ·
`chronos` · `jsonic` · `valhalla`.

Target shape (settled earlier):
- **maya** — runtime.
- **thoth** — build/compiler (+ vite-plugin, + dom-info as internals).
- **azoth** — umbrella (the published install: re-exports maya + the vite plugin).
- **valhalla** — conformance suite (author-JSX → thoth → maya).
- **chronos** — out. **jsonic** — own `azothjs` org repo.

## Dependency facts (verified)

- `azoth` depends on + re-exports `chronos/generators` (`exports["./chronos/generators"]`), maya, vite-plugin. So azoth is **published v1.4.5 on npm**.
- `jsonic` — no cross-package consumers (clean to extract).
- `dom-info` — imported by `thoth/transform/Analyzer.js` (`resolveDynamic`, `resolveStatic`, `isKnownElement`). A real thoth dependency.

## Moves, stakes, sequence

| # | Move | Stakes | Owner |
|---|---|---|---|
| 1 | **valhalla reframe** — README/identity: "public-API/conformance (author-JSX→thoth→maya)", not "projects converging" | trivial, no code | solo-safe |
| 2 | **chronos out** — remove pkg; drop azoth's dep + `./chronos/generators` export | **BREAKING azoth API** → major bump; confirm no consumers of azoth/chronos/generators | **your call** (versioning) |
| 3 | **jsonic → own org** — standalone; git-filter to preserve history into a new repo | **needs you** to create `azothjs/jsonic`; I can prep removal from this workspace | **you** (repo) |
| 4 | **dom-info** — keep as thoth's dep, mark internal (not published standalone), OR fold code into thoth (relative import) | folding touches well-tested thoth; keeping-as-dep is minimal | **your call** (fold vs keep) |
| 5 | **vite-plugin → thoth** — fold into `@azothjs/thoth/vite`; remap azoth's `./vite-plugin` export | **packaging/export change** → coordinate with the bump | **your call** (with #2's bump) |

## Why this needs you, not solo execution

azoth is a **published package**; #2 and #5 change its `exports` → breaking → a
**major version bump** (your versioning decision). #3 needs an **external repo**
you create. #4 is a fold-vs-keep judgment. So: I execute the mechanical parts on
your go; the publishing/versioning/repo decisions are yours.

## Proposed order

1. **valhalla reframe** (trivial, solo) — can do now.
2. Decide **chronos removal** + the **azoth major bump** (it gates #2, #5).
3. **vite-plugin → thoth** (with the bump).
4. **dom-info** fold-or-keep.
5. **jsonic** extraction (you create the repo; I prep the workspace removal).
