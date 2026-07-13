# azoth

## 2.0.1

### Patch Changes

- d2f1f29: Ship `llms.md` — a self-sufficient guide for AI assistants writing azoth
  code — inside the package (`node_modules/azoth/llms.md`; also indexed from
  the repo-root `llms.txt`). Zero-network affordance: agents working in a
  repo that installs azoth can read the full rules, verified examples, and
  catch-and-correct table straight from `node_modules`.
- Updated dependencies [816e237]
  - @azothjs/thoth@2.0.1
  - @azothjs/maya@2.0.1

## 2.0.0

### Major Changes

First public release. From 2.0.0 forward, `azoth`, `@azothjs/maya`, and
`@azothjs/thoth` version together (one release train); the umbrella pins the
exact matching versions.

- **New root entry**: `import { Channel, pushable, rerenderer } from 'azoth'`
  — the author surface in one import. `azoth/vite-plugin` and
  `azoth/runtime` unchanged; the duplicative `azoth/maya` and
  `azoth/maya/channels` subpaths are removed (the root covers them; the
  scoped `@azothjs/maya/*` subpaths remain for precise imports).
- **TypeScript/TSX**: `jsx.d.ts` now ships and is the package `types` entry —
  JSX element typing, the `Composable` union, component signatures.
- **Vite plugin consolidated**: `@azothjs/vite-plugin` and `@azothjs/chronos`
  are retired; the plugin lives in `@azothjs/thoth` and is re-exported here
  as `azoth/vite-plugin`.
- See `@azothjs/maya@2.0.0` and `@azothjs/thoth@2.0.0` for the runtime and
  compiler changes (breaking: `channel()` → `<Channel>`, blocks → KeyedList,
  `az:`-prefixed anchors, uniform async replace semantics).

### Patch Changes

- Updated dependencies
  - @azothjs/maya@2.0.0
  - @azothjs/thoth@2.0.0

## 1.4.5

### Patch Changes

- Bump to pick up the latest @azothjs/\* packages (thoth JSX fixes, vite-plugin multi-page fix, chronos/maya internal cleanup). Internal config updates (ESNext module configuration).
- Updated dependencies
- Updated dependencies
  - @azothjs/chronos@0.4.4
  - @azothjs/maya@0.4.4
  - @azothjs/vite-plugin@0.4.5
