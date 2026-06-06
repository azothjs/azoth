# Azoth TODO

## Maya

### Channel features

Already landed: `<Channel>` JSX component (Channel class = JSX
component), `source` / `as` / `map` props, childNodes-as-initial,
Channel-wrapped source unwrap. See `packages/maya/channels/channel.js`.

Still to add:

- **`ReadableStream` support** in `Channel`'s `makeAsyncStream` and in
  `compose.js`. compose.js already handles ReadableStream in the value
  position but Channel's source-type switch doesn't yet.
- **Observable support** in `Channel` and `compose.js`. compose.js has
  a TODO at lines 76-78 (`.subscribe` / `.on`). Subscribe with
  `{ next, error, complete }` observer per TC39 proposal shape.
- **`error` transform prop** on `<Channel>`. Symmetric with `as` —
  transform error values into renderable output. Uncaught by default
  when source errors and no `error` prop provided.
- **Private fields** on Channel — `.initial` and `.source` as
  read-only getters backed by private fields. Class is exported (it
  has to be, JSX needs it) but instances are immutable after
  construction.

### Compose subtractions

- **Remove primitive-as-component path** in `packages/maya/compose/compose.js`.
  Currently `<Cat />` where `Cat = 'bill'` renders 'bill'. Should
  throw — passing a primitive as a component is almost always a bug.
- **Remove DOM-overlay (skinning) path**. The `Object.assign(input, props)`
  branch when `input instanceof Node` lets you "skin" an existing DOM
  node by overlaying component props. Marty's call: drop it. Component
  invocation means "construct"; skinning is a separate verb that may
  or may not return.

## Chronos

### Rename generator to stream

The `generator()` function should be renamed to `stream()`:
- `stream` works as both verb and noun
- `generator` describes implementation, not purpose
- Return value names: `[asyncIterator, push]` instead of `[asyncIterator, dispatch]`

```js
// Before
const [results$, dispatch] = generator(transform);

// After
const [results$, push] = stream(transform);
```

### Decide on Multicast / fan-out

`Multicast` is still in chronos but has no production callers (the
chronos channels/branch.js that used it is gone). Either:
- Keep as scaffolding for a future iterators-with-many-consumers
  primitive, OR
- Defer entirely to RxJS / TC39 Observable for the fan-out story
  and remove.

## Components

### TypeScript / JSDoc type definitions for Azoth's built-in components

`<Channel>` (and any future built-in components) should ship with
typed prop signatures so consumers get autocomplete + error checking.
Open question: prop relationships that JS can't easily express in
types — e.g. `map` should only be allowable when `source` produces
arrays. JSDoc with `@template` + conditional types, or per-component
`.d.ts` overloads.

Don't slide into doing this now — capture as a need so it gets
attention when the component surface stabilizes.

## Compose

### Accept null from components

Components returning `null` or `undefined` should render nothing
instead of throwing. Currently components must return a DOM element.

## Docs

### Topic doc refresh

`docs/topics/async-and-channels.md` and a few others still reference
the old `channel()` function form and `@azothjs/chronos/channels`
imports. The canonical surface is now `<Channel>` JSX +
`@azothjs/maya/channels` import. Pass through the topic docs to
update.

### Downstream: wre-dashboards imports

`wre-dashboards/src/components/AgentDashboard/AiAnalysis/AiAnalysis.jsx`
and adjacent files import from `azoth/chronos/channels`. That export
path is gone in this branch (replaced by `azoth/maya/channels`).
wre-dashboards needs updating before or after this branch merges,
otherwise its build breaks.
