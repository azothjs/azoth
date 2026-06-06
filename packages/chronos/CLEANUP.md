# Chronos status and direction

## Current state

Chronos is a standalone async-generator package. Production surface:

- `@azothjs/chronos/generators` — `generator()`, `reduce()`

That's it. No maya dependency, no rendering coupling.

## What chronos provides

### `generator(transform?)` → `[asyncIterator, dispatch]`

A push-driven async iterator. Pure platform primitives
(`Promise.withResolvers` + `async function*`). Values dispatched before
consumption begins are queued FIFO.

### `reduce(reducer, init?, initialAction?)` → `[asyncIterator, dispatch]`

Reducer pattern over a generator. Each dispatch passes through the
reducer with the running state.

### `Multicast` (class)

Fans an async iterator out to multiple subscribers. Each subscriber
gets its own push-driven iterator with an optional per-feed transform.

## Pairing with a renderer

If a downstream consumer wants to render the iterator with an initial
state, they pair at their own layer. For maya:

    const [iter, dispatch] = generator();
    // …
    <main><Channel source={iter}>loading…</Channel></main>

Chronos does not assume any particular rendering library.

## Direction

This shape is close to where chronos likely lands long-term:

- Possibly rename `generator` → `stream` (per `azoth/TODO.md`).
- Possibly add a `subject` or similar BehaviorSubject-like primitive
  if RxJS / TC39-Observable interop matters.
- `reduce` may rename to `reducer` for consistency.

The "channels" concept — single source → transform → single downstream
consumer — lives entirely in maya as the `Channel` class/component.

## Removed during the channel/Channel public-API refactor

- `channels/branch.js`, `channels/tee.js`, `channels/consume.js`,
  `channels/channel.js` — moved or removed. The channel-rendering
  concept lives in maya. branch/tee/consume relied on legacy options
  (`init`/`start`/`map`) and a multi-consumer fan-out shape that
  didn't map onto the one-to-one Channel contract.
- `generators/unicast.js` — was a thin wrapper for `{ init }`
  semantics that no longer exist. Users call `generator()` directly.
- `resolve-args.js`, `throw.js` — option-handling helpers that became
  dead code once options were stripped.
- `Channel.from()` static factory on maya's Channel — no callers
  outside removed chronos code. Users construct with
  `new Channel({source}, initial)` if they need direct construction.

## Open questions

- Does `Multicast` survive? It's not used by anything in production
  right now. If a fan-out primitive matters long-term, RxJS / TC39
  Observable may be the better answer. For now: kept as scaffolding
  in case it's useful for future iterators-with-many-consumers
  patterns.
- Should `reduce` accept a `Channel`-shaped input on the consumer side?
  Currently it doesn't — it's a pure async-generator primitive.
