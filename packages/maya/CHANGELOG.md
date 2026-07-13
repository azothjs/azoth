# @azothjs/maya

## 2.0.1

### Patch Changes

- Version alignment with the 2.0.1 release train (no runtime changes).

## 2.0.0

### Major Changes

First public release; versions now move with `azoth` and `@azothjs/thoth`.

- **Rerenderer**: `rerenderer(fn)` re-executes against a per-call-site cache
  — same DOM back, rebound with new values; control flow just works
  (branches sleep, lists shrink by position). `renderer(fn)` is the
  fresh-build reset.
- **KeyedList family**: `KeyedUList` / `KeyedOList` / `KeyedTable` custom
  elements — keyed rows with delta ops (`add`/`addAll`/`insert`/`update`/
  `move`/`remove`/`clear`/`keyFor`), per-row rerenderers.
- **Channel + the Input shape**: `<Channel source as error map append
eventType>` over Promise / async iterable / Observable / EventTarget
  sources; compose recognizes the structural Input shape
  `{ initial?, from, append? }` — Channel is one implementer.
- **`pushable()`**: `[asyncIterator, push]` — the bridge from push/callback
  APIs to pull iteration.
- **Anchors are `az:`-prefixed** (`<!--az:N-->`): the count of nodes a slot
  owns, and the trust boundary — authored comments in content are inert.
  DocumentFragment children are counted correctly.
- **Uniform async semantics**: every source replaces by default
  (ReadableStream's accumulate special case removed); accumulation is
  opt-in via `append`. Live sources are torn down on slot clear / source
  switch (AbortController-based).

Breaking:

- `channel()` function form removed → `<Channel>` / `new Channel(props,
childNodes)`.
- Blocks (`KeyedBlock`, `Controller`, `Updater`, `use()`) removed →
  KeyedList + the controller recipe.
- Slot functions are called with no arguments (props/childNodes intake is
  component territory).
- Bare `{stream}` in a slot replaces per chunk (was: accumulate).

## 0.4.4

### Patch Changes

- Internal cleanup: dead code removal, module/config updates (ESNext, moduleResolution), dependency bumps (vitest, webdriverio). No public API changes.
