# @azothjs/thoth

## 2.0.1

### Patch Changes

- 816e237: The Vite plugin now sets `esbuild: { exclude: ['**/*.jsx', '**/*.tsx'] }`
  via its `config` hook — Vite's built-in esbuild pipeline never touches
  JSX/TSX, so the manual exclude that getting-started configs previously
  needed (and the README didn't show) is no longer required.

## 2.0.0

### Major Changes

First public release; versions now move with `azoth` and `@azothjs/maya`.

- **`az:`-prefixed anchor markers**: templates emit `<!--az:0-->` — the
  runtime trust boundary between azoth anchors and authored comments.
  Template ids are content hashes, so all dynamic-template ids changed.
- **Vite plugin lives here**: `@azothjs/thoth/vite` (the former
  `@azothjs/vite-plugin` package is retired; `azoth/vite-plugin` re-exports
  it). Per-call-site template factories — the identity the maya rerenderer
  keys on.
- **dom-info folded in**: the curated DOM property/attribute data (static
  attribute vs runtime property resolution, NON_STATIC promotion, SVG)
  ships with the compiler.
- JSX comments compile away cleanly (no anchor, no child-index skew);
  no-attribute component invocations pass `{}`; component children compile
  as their own template and arrive as one Node.
- Vite peer range widened to `^5.0.12 || ^6`.

## 0.4.5

### Patch Changes

- JSX handling fixes:
  - Always pass `{}` for no-attribute component invocations
  - Skip JSX comments in HTML template generation
  - Resolve targetKey collision via JSON.stringify for tMap
  - Handle boolean props without values in custom components
  - Allow digits in component-identification regex
