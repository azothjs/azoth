# Azoth TODO

## Chronos

### Consolidate `generator` into maya `pushable`

The maya package now exports `pushable()` (in `@azothjs/maya/channels`)
which is the same push-to-pull bridge `chronos.generator()` provides —
minus the transform parameter (moved to call site / Channel.as /
iterator helpers). pushable is canonical going forward.

To finish the consolidation:
- Migrate `wre-dashboards` (and any other downstream) off
  `azoth/chronos/generators` to `azoth/maya/channels`. The transform
  argument used in `AgentSearch.jsx` line 14 becomes either an explicit
  `await` at the call site or a `Channel.as` transform.
- Remove `chronos/generators/generator.js` once no consumers remain.
- The chronos package's role narrows further (or dissolves) — open
  design question, not a blocker.

### Multicast disposition

`Multicast` is still in chronos but has no production callers (the old
chronos `channels/branch.js` that used it is gone). Either:

- Keep as scaffolding for a future iterators-with-many-consumers
  primitive, OR
- Defer entirely to RxJS / TC39 Observable for fan-out and remove.

The EventTarget-based broadcast helper sketched as a future utility
(see Channel section) may obviate Multicast entirely — EventTarget is
naturally multi-listener, which is the actual ask.

## Channel

### Multi-listener broadcast helper (future utility)

Async iterators are single-consumer. When code needs fan-out (one source
→ multiple Channels), the right shape is to lift into an EventTarget
(naturally multi-listener) rather than try to share an iterator. A small
helper for "create EventTarget + push function" would smooth the DX:

```js
const [target, push] = broadcastTarget('change');
push(value); // dispatches CustomEvent
<Channel source={target} eventType="change" as={A} />
<Channel source={target} eventType="change" as={B} />
```

Park until a real multi-listener use case shows up to shape the API.
Naming, default eventType, CustomEvent boxing — all decisions that
benefit from real usage informing them.

### Cancel semantics / AbortController

Channel currently has no way to signal "I'm done with this source" back
upstream. Sources that hold resources (open WebSockets, ongoing fetches)
keep going. Natural shape: an `AbortController` prop, hooked into compose's
slot lifecycle. Defer until a real-world need surfaces; design is open.

### Channel role evolution

When async iterator helpers ship (Stage 2, est. 2027-2028), Channel's
`as`/`error`/`map` props become "convenience over what you'd write with
iterator helpers." The structural role narrows to: initial DOM
(presentation), append directive (orchestration), cancel propagation
(lifecycle).

Don't preemptively split or rename. The right call right now is to not
make a call. Re-evaluate when the platform shape clarifies and real
usage tells us which residue actually matters.

## Components

### Typing review — d.ts + JSDoc for consumer type info

Doing valhalla in `.tsx` was the forcing function that uncovered gaps
between runtime behavior and the type definitions. The runtime accepts
considerably more than the types currently model. The review:

**`DOMChild` (in `packages/azoth/jsx.d.ts`) is incomplete.** Today it's
`string | number | boolean | Node | null | undefined | DOMChild[]`. compose
also accepts at runtime — and should be reflected in the type:
- `Promise<DOMChild>`
- `AsyncIterable<DOMChild>`
- `ReadableStream<DOMChild>`
- Observable-shaped (`{ subscribe(...) }`)
- Render objects (`{ render(props?, childNodes?) }`)
- Function references (invoked with no args by compose)
- `Channel` instances
- `IGNORE` sentinel
- `bigint`

The mismatch surfaces concretely at `packages/valhalla/channels.test.tsx:317`
where an observable-in-slot needs an `as unknown as JSX.Element` cast.

**`<Channel>` props need typed signatures with constraint relationships:**
- `eventType` required ⟺ `source` is an `EventTarget`
- `map` meaningful only when source produces arrays
- `error` transform returns must match what `as` returns
- `append` boolean-presence semantics (JSX attribute style)

JSDoc with `@template` + conditional types is one path; per-component
`.d.ts` overloads another. Open question.

**`pushable`, render-object form, class-component form, function-component
form** also need typed surfaces. The public API is stable enough now that
this work pays off; it's a real next step.

## Compose

### Accept null/undefined return from components

Components returning `null` or `undefined` should render nothing rather
than risk errors downstream. Arrow components already get `?? null`
coercion; class/function-with-prototype components return whatever the
constructor returns (typically the new instance even when the body
`return null`s, unless an object is explicitly returned). Worth verifying
the full surface and aligning so authors can write `return null` to mean
"render nothing" regardless of component form.

### Performance research (parked)

`compose` is the hot path. Older lore said "call functions with consistent
arity for V8 perf" — that's no longer true. V8 8.9 (Feb 2021) removed the
arguments adaptor frame; calling with fewer/more args than formal params
no longer pays the adaptor cost. Source: v8.dev/blog/adaptor-frame.

What still matters for hot dispatch code on modern engines:
- Hidden class / shape stability on `anchor`, `props`, `input`
- Monomorphic inline cache stability on property accesses
- Function size relative to inlining thresholds
- Avoiding deopts from mid-flight shape changes

Park until a real regression motivates the work. Benchmarks need
realistic render trees; speculative micro-optimization risks worse
shape stability than the current code.

## Platform tracking (informational)

### Async iterator helpers (Stage 2, est. 2027-2028)

When `AsyncIterator.prototype.map/filter/catch/...` ships, Channel's
data-pipeline props become optional sugar for what iterator helpers
express directly:

```jsx
// Today
<Channel source={events$} as={Notification} error={ErrorBanner} />

// When async iterator helpers ship
<Channel source={events$.map(Notification).catch(ErrorBanner)} />
```

Both forms remain valid. The change is "data transforms can live upstream
in the iterator chain instead of as Channel props." See Channel role
evolution.

### WICG Observable + `EventTarget.prototype.when()`

Chrome 135+ has shipped Observable; Firefox is implementing. When
`target.when('foo')` becomes widely available, our `fromEventTarget`
shim becomes a polyfill (and may delete entirely — Observable-shape
sources already flow through the existing `.subscribe` detection
branch). No action now; track adoption.

## Docs

### Topic doc refresh

`async-and-channels.md` and `maya-runtime.md` are aligned with the
current API (including EventTarget + pushable as of this batch). Still
referencing the old `channel()` function form and/or `@azothjs/chronos/channels`
imports:

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
path is gone (replaced by `azoth/maya/channels`). Also:
`AgentSearch.jsx` line 14 imports `generator as stream` from
`azoth/chronos/generators` — migrate to `pushable` from
`azoth/maya/channels` (transform moves to the call site or Channel.as).

wre-dashboards needs updating before or after this branch merges,
otherwise its build breaks.

## External (not Azoth code)

### Vitest snapshot bug — PR ready at `/tmp/vitest-fork`

A 4-character regex fix to a vitest snapshot-serialization bug
discovered during this work. See `OVERNIGHT-NOTES.md` at repo root for
details. Sitting unmerged; needs to be turned into an upstream PR.
