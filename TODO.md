# Azoth TODO

## Chronos

### Rename `generator` to `stream`

`generator()` describes implementation; `stream()` describes purpose and
works as both verb and noun. Return-value names also change:

```js
// Before
const [results$, dispatch] = generator(transform);

// After
const [results$, push] = stream(transform);
```

### Multicast disposition

`Multicast` is still in chronos but has no production callers (the old
chronos `channels/branch.js` that used it is gone). Either:

- Keep as scaffolding for a future iterators-with-many-consumers
  primitive, OR
- Defer entirely to RxJS / TC39 Observable for fan-out and remove.

## Components

### TypeScript / JSDoc type definitions for built-in components

`<Channel>` (and any future built-in components) should ship typed prop
signatures so consumers get autocomplete + error checking. Open question:
prop relationships JS can't easily express in types — e.g. `map` should
only be allowable when `source` produces arrays. JSDoc with `@template` +
conditional types, or per-component `.d.ts` overloads.

The Channel public API is now stable enough that this is a real next
step rather than a deferred one.

## Compose

### Accept null/undefined return from components

Components returning `null` or `undefined` should render nothing rather
than risk errors downstream. Arrow components already get `?? null`
coercion; class/function-with-prototype components return whatever the
constructor returns (typically the new instance even when the body
`return null`s, unless an object is explicitly returned). Worth verifying
the full surface and aligning so authors can write `return null` to mean
"render nothing" regardless of component form.

## Docs

### Topic doc refresh

`async-and-channels.md` and `maya-runtime.md` are aligned with the
current API as of this branch. Still referencing the old `channel()`
function form and/or `@azothjs/chronos/channels` imports:

- `docs/ASYNC-PATTERNS.md`
- `docs/async-rendering-patterns.md`
- `docs/MENTAL-MODEL.md` (origin artifact — may be intentional history)
- `docs/index.md` (line 110)
- `docs/topics/maya-runtime.md` (line 205 — passing reference in a list)
- `docs/topics/hypermedia.md` (lines 135, 156, 252)
- `docs/topics/coming-from-react.md` (line 70)
- `docs/topics/index.md` (line 21)
- `packages/valhalla/index.md` (line 31 — describes old test surface)

Pass through and update to `<Channel>` JSX + `@azothjs/maya/channels`.
MENTAL-MODEL.md may be left as-is since it's the historical artifact.

### Downstream: wre-dashboards imports

`wre-dashboards/src/components/AgentDashboard/AiAnalysis/AiAnalysis.jsx`
and adjacent files import from `azoth/chronos/channels`. That export
path is gone in this branch (replaced by `azoth/maya/channels`).
wre-dashboards needs updating before or after this branch merges,
otherwise its build breaks.

## External (not Azoth code)

### Vitest snapshot bug — PR ready at `/tmp/vitest-fork`

A 4-character regex fix to a vitest snapshot-serialization bug
discovered during this work. See `OVERNIGHT-NOTES.md` at repo root for
details. Sitting unmerged; needs to be turned into an upstream PR.
