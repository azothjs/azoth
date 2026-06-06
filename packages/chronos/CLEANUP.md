# Chronos cleanup notes

Captured during the channel/Channel public-API refactor in maya. Chronos
was originally intended as a full async-generator state-management
solution; it now needs a narrower scope. The user-facing `<Channel>`
component lives in maya. Chronos retains lower-level utilities for the
async-generator side.

## Direction

Chronos likely ends up as:

- **`stream`** — a lighter-weight async generator factory (currently called
  `generator` in `generators/generator.js`). Returns `[asyncIterator, push]`.
  See `azoth/TODO.md` for the rename.
- **`reducer`** — a reduce-over-stream variant for accumulated state.

The Channel concept (single source → transform → single downstream consumer)
lives in maya. Chronos is the async-data plumbing underneath.

## What landed

### Sync return removed from chronos generators

`generator()` and `reduce()` no longer return `Channel`-wrapped values.
They return plain `[asyncIterator, dispatch]`. Tests that relied on the
sync return (via `ChannelReader` or via JSX-mounting the result directly
expecting an initial state) were updated or removed.

- `generator.js`: option handling (init/start/map/onDeck) stripped.
  Signature is now `generator(transform?)` → `[asyncIterator, dispatch]`.
  Values dispatched before consumption begins are queued FIFO.
- `reduce.js`: returns `[asyncIterator, dispatch]`. The caller has `init`
  in scope and pairs it with `Channel.from(init, iter)` if they need an
  initial render value.
- `unicast.js`: removed. It was a thin wrapper over `generator()` with
  an `{ init }` option; with `init` gone, it had no purpose distinct
  from `generator()`. Users call `generator()` directly.
- `Multicast.js`: kept. Still defensively unwraps Channel-typed inputs
  (users may still pass Channels in from outside chronos). `subscriber`
  no longer accepts options — its only argument is the per-feed transform.

### What stayed in the legacy compat layer

The `channel()` function in maya still accepts the legacy `{ init, start,
map }` options. That layer exists for the chronos `branch.js`
promise-path which calls into `channel()` with those options. To be
removed when chronos's branch/tee/consume are reworked.

The `map` semantic in branch.js's async-iterator path is now wrapped
locally in `branchAsyncIterator` (rather than passing options into
`generator()`). It uses chronos's historical "if array, map per
element; else pass through unchanged" semantic, which is intentionally
different from maya's Channel.map (which applies transform to non-array
values too). Both are correct for their context.

## What needs rework

### `branch()` and `tee()` and `consume()`

These take multi-consumer / fan-out shapes that don't map onto the new
one-to-one Channel contract. They currently rely on:

- The legacy `{ init, start, map }` options on `channel()` (deprecated but
  preserved as a compat layer)
- The chronos `resolve-args.js` helper that handles those options
- An onDeck mechanism in the old channel() that yielded the transformed init
  as the first value after start — used when both `{ start, init }` were
  provided together (Marty called this "wild speculation")
- The internal `generator()` and `Multicast` pipeline which uses init/start
  vocabulary

The new public `channel()` API takes only `{ initial }`. The compat layer
in `packages/maya/channels/channel.js` accepts the legacy options as
aliases for back-compat with this chronos pipeline. The compat layer is
flagged for removal once chronos is reworked.

### Currently skipped tests

These tests exercise legacy behavior that's intentionally gone post-refactor:

- `branch.test.jsx > promise > all transform/option combos` (skipped) —
  exercises `{ start, init }` combo with onDeck yielding.
- `branch.test.jsx > async iterator > all transform/option combos` (still
  passing under chronos's `generator()` which retains the onDeck behavior
  internally — but the test depends on chronos-internal semantics that
  should be reworked).

Restore (or rewrite) these once branch is redesigned.

### Resolving naming drift

The chronos pipeline uses `{ init, start, map }`. The maya `<Channel>` /
`channel()` uses `{ initial }`. Pick one vocabulary for chronos:

- If chronos becomes `stream` + `reducer` only, the option vocabulary
  question may resolve itself (those primitives are simpler than `channel`).
- If chronos retains `branch`/`tee`/`consume` in some form, align them on
  `{ initial }` to match maya.

## What to keep

- `generators/generator.js` (or its rename to `stream.js`) — the async
  generator factory with `[iter, push]` shape.
- `generators/reduce.js` — the reducer variant.
- `generators/unicast.js`, `generators/Multicast.js` — supporting plumbing
  (may or may not survive depending on whether `branch`/`tee` survive).
- `with-resolvers-polyfill.js` — platform polyfill, keep.

## What might go away

- `channels/branch.js`, `channels/tee.js`, `channels/consume.js` — if the
  new model is one-to-one Channel + observables for fan-out (RxJS today,
  TC39 Observable when stable), these may not pull their weight.
- `resolve-args.js` — only useful while the legacy options vocabulary
  exists.
- `throw.js` — error classes for legacy options. Slim down when options go.

## Open questions for the cleanup pass

- Does `consume` belong in maya (rendering-adjacent side-effect helper)
  or stay in chronos (or get deleted in favor of RxJS-style `tap`)?
- Is `tee` actually needed if observables are the fan-out story?
- Should `reducer` accept a `<Channel>`-shaped input directly?
