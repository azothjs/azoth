# Azoth TODO

## Blocks / rerenderer follow-ons

Landed: **KeyedList** shipped (abstract base + `KeyedUList`/`KeyedOList`/
`KeyedTable` leaves; add/addAll/insert/update/move/remove/clear/has/get/keyFor;
controller pattern; `Map<key, rerenderer(view)>` per-row model). Legacy
`Controller`/`Updater` + injectable/`getBound` path removed. Design:
`docs/design/keyed-list.md`, `frame-primitives.md`.

Open:
- **Rerenderer naming bikeshed** (Rerender vs Rerenderer) — deferred.
- **VirtualList** (recycled-pool / virtualization, FUTURE, separate block) —
  `docs/design/VirtualList.md` + `frame-primitives.md`.
- **Teaching docs**: tie the init→update patterns (module-factory / class /
  object UIComponent / plain render fn) to realistic UI-layout management —
  worked examples, not mechanism explainers.



## Channel

### Cancel semantics / AbortController

The slot-lifecycle half landed (2026-07): compose tears down a live source when
its anchor is cleared (WeakMap<anchor, cancel> + reentrancy guard — see Compose
→ Async source teardown). What remains is the AUTHOR-initiated half — a Channel
`AbortController`/`cancel` prop so code can say "I'm done with this source" and
release upstream resources (open WebSockets, ongoing fetches), not just react to
a swap. Defer until a real-world need surfaces; design is open.

### Channel role evolution

Channel carries two roles (named explicitly 2026-06-11 after
considering a split):

1. **Orchestrator** (the "Anchor" role) — control over compose:
   initial DOM render, append directive, (future) cancel. Source-
   agnostic: the slot doesn't care where the DOM came from — another
   module's exported Channel, or (future) HTML streamed and parsed
   from a server.
2. **Transformer** — `as`, `map`, `error`. A stand-in until the
   platform pulls transform duty into sources themselves (async
   iterator helpers, Stage 2, est. 2027-28).

Considered and rejected: splitting into `<Anchor source={...}>` +
`channel(source, transform)`. The split is conceptually clean — it IS
the end-state architecture — but: (a) the unified Channel degrades
gracefully INTO the split, since source-side transforms already work
today (`source={x.then(f)}`) and `as`/`error`/`map` simply become
unused props when helpers land — no breaking change; the reverse
re-merge would break; (b) it resurrects the lowercase `channel()`
shape this branch just subtracted; (c) it pays a two-concept DX tax
for the entire 2-3 year interim. Decision: stay flat. Revisit only
when source transforms are native.

Docs-pass note: the "module exports a Channel, consumer slots it into
any DOM" separation-of-concerns pattern deserves a documented example
(search box + paging + results in one module, Channel out — no
component-tree demands). Connects to the hypermedia thesis.

## Components / typing — precision pass (follow-on)

valhalla typechecks fully (`.tsx`, 0 errors). Landed 2026-07: a full
`Composable` union in jsx.d.ts — everything compose accepts — with `DOMChild =
Composable`; `JSX.ElementType` = string tag | null/undefined (conditional
no-op) | function | class | `Component` object, all returning `Composable`, with
the `(props, childNodes)` arity; and the `UIComponent` (base: render/update) vs
`Component` (create's full: + `initialize`) split. maya's types reach valhalla
via `allowJs`. Remaining is *depth* (optional, on-demand):

**`Composable` — last gaps** — it now covers primitives, Node, Channel, Input,
UIComponent, Promise, AsyncIterable, ReadableStream, function/rerenderable,
arrays. Still missing: **Observable-shaped** (`.subscribe`) and the **`IGNORE`**
sentinel — the `as unknown as JSX.Element` casts in `channels.test.tsx:285`
(Observable) and `rerenderer.test.tsx` persist for these.

**`<Channel>` props are `any`** — its constructor param is untyped, so neither
`new Channel({…})` nor `<Channel …>` deep-checks props. Typing the constructor
(JSDoc **on Channel** — types-closer-to-the-object) unlocks both: `eventType` ⟺
EventTarget source, `map` ⟺ array source, `error`/`as` return match, `append`.

**Per-form prop typing** — `pushable`, render-object, class-/function-component
surfaces. `@template`/conditional types vs per-component `.d.ts` — open.

**`childNodes` type on component signatures** — jsx.d.ts types the second
component arg as `any` (matches the JSDoc `*`). Tighten to `Node`, `Composable`,
or a specific child-nodes shape? Pin the compiler's actual childNodes shape
first.

**`Component.initialize?` — optional vs required** — the Component typedef
(create's full lifecycle) has `initialize?` optional, matching create's
`initialize?.()`. Should create REQUIRE initialize (drop the runtime `?.`, make
the type `initialize`)? A stricter contract vs the current lenient runtime —
decide together.

## Compose

### Accept null/undefined return from components

Components returning `null` or `undefined` should render nothing rather
than risk errors downstream. Arrow components already get `?? null`
coercion; class/function-with-prototype components return whatever the
constructor returns (typically the new instance even when the body
`return null`s, unless an object is explicitly returned). Worth verifying
the full surface and aligning so authors can write `return null` to mean
"render nothing" regardless of component form.

### Async source teardown — follow-ons

compose now cancels a live source on clear (a `WeakMap<anchor, cancel>` plus a
`currentSource` reentrancy guard so a source's own value doesn't self-cancel;
covers async-iter / promise / stream / observable).

- **withAbort ↔ pushable**: should `pushable` (packages/maya/channels/
  pushable.js) return `[results$, push, cancel]` — a cancel alongside push — so
  the abort machinery is shared/exposed there too? Or overreaching (keep
  pushable minimal; let compose/Channel own cancellation)? Revisit once the
  `withAbort` shape settles; may collapse compose's `aborted()` into channel's.

Resolved 2026-07: **composeStream deleted** — a direct `{aStream}` now flows
through the asyncIterator branch like every async sequence (replace default;
accumulate opts in via Channel/Input `append`). The pre-Input accumulate
special case (2023-era) and its ReadableStream-before-asyncIterator ordering
constraint are gone.

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

Harness direction (2026-07, not a release gate): wire into krausest's
js-framework-benchmark rather than a custom harness — KeyedList maps
directly onto its rows model, and the numbers are corpus-standard.
A martypdx fork exists (gh + another user account on this laptop),
~2 years stale; needs a rewrite against current azoth.

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

### DOM Parts (WICG, early incubation)

Azoth's compiled binders are literally "DOM parts in a part group"
(see docs/design/rerenderer.md). The proposal space is early with
multiple competing drafts — Azoth has working evidence (compiled
part-groups + the Rerenderer's apply-values mechanism) to offer the
direction conversation. Watch the repo; consider a position
write-up once 2.0 ships.

### WICG Observable + `EventTarget.prototype.when()`

Chrome 135+ has shipped Observable; Firefox is implementing. When
`target.when('foo')` becomes widely available, our `fromEventTarget`
shim becomes a polyfill (and may delete entirely — Observable-shape
sources already flow through the existing `.subscribe` detection
branch). No action now; track adoption.

## Docs

Resolved 2026-07 (the tests-as-docs prune):

- **VitePress deleted** — the repo's MDs are the docs surface; brand assets
  moved to `docs/assets/`; the dangling-nav item went with it.
- **Mechanics prose archived** to `docs/history/` (composition,
  async-and-channels, attributes-and-properties, maya-runtime, typescript,
  scratchpad) — superseded by valhalla (`compose.test.tsx` et al.) +
  `docs/design/core-rules.md`. Survivor links repointed; `topics/index.md`
  and `valhalla/{README,index}.md` rewritten as the entry points.
- **Currency pass done** — the old `channel()` refs (hypermedia,
  coming-from-react), "blocks" → keyed lists (for-llms, coming-from-react),
  and the JSX-comment crash entry flipped to Resolved (pinned in
  `smoke.test.tsx` + `compiler.test.js`).

Still open: `components.md` stays prose until component-forms tests land in
valhalla (class / object+initialize / chain rule / null no-op / thrown
messages) — write those, then fold-or-archive it. Earlier loose-docs
resolution (maya.md etc.) noted in git history.

## dom-info (folded into thoth — `packages/thoth/dom-info/`)

### Browser-validation suites — on-demand, not in CI

The `dom-props` / `events` / `svg` suites probe the pinned Chromium to confirm
the lifted platform data still matches. Excluded from the default run; run on
demand via `pnpm test:validate` (`VALIDATE=true`). They change only on a
dependency or Chromium bump.

Open follow-ons:
- Wire `test:validate` into a CI job gated to PRs/merges that touch
  `packages/thoth/dom-info/**` or bump the relevant deps (property-information,
  html/svg-element-attributes, html/svg/mathml-tag-names, playwright) — rather
  than every push.
- A "deps current?" check (renovate, or scheduled `pnpm outdated` on those
  packages) to signal when re-validation + data regeneration is due.
- No README for the dom-info module yet; document the data sources + validation
  workflow (now under thoth).

## External (not Azoth code)

### Vitest snapshot bug — fix applied locally; upstream PR still open

A 4-character non-greedy regex fix to vitest's inline-snapshot updater
(`@vitest/snapshot`, coalesces snapshots after a comment). Now applied to
this repo via `pnpm patch` (`patches/@vitest__snapshot@4.1.8.patch`) since
the martypdx fork is vitest 5.0-beta (a major ahead of our 4.1.8). The
upstream PR (martypdx fork) is still to be opened; drop the patch once it
lands and we bump. See `OVERNIGHT-NOTES.md` for the original discovery.

### Vitest -u second bug — adjacent same-test snapshots mis-assign (LOW PRIORITY, spike)

Separate from the comment-greedy bug above. With two `toMatchInlineSnapshot()`
calls in the SAME test, `-u` mis-assigns: one value lands on the wrong call,
the other is lost. Repro'd minimally (2026-06-15) — NOT triggered by comments
or identical expressions; the trigger is subtle position-tracking in
saveInlineSnapshots. The comment patch does not cover it. Workaround in use:
`toBe()` with known values, or fill snapshots one at a time. Spike to isolate
the exact trigger and fold into the upstream fix. Low priority — single-
snapshot-per-test (the common case) is unaffected.

BROWSER MODE is worse (2026-07, building valhalla compose.test.tsx): filling
many empty snapshots in one browser-mode run coalesces several values onto
one call and leaves others empty; filling ONE AT A TIME via `-t` still lands
values on the WRONG calls (offset by skipped tests — the write-back resolves
call sites against executed-test ordinals, not file positions). Node-env
files fill fine (compose.clear.test.js, 4-in-one-run, correct). Workaround
that held: capture real output via a probe assertion (`expect('SNAP>>>' +
JSON.stringify(v)).toBe('')`, harvest Received from the failure), freeze to
`toBe`/`toEqual` directly. Fold this evidence into the spike.

## ESLint usage review (lower priority)

Revisit how azoth configures ESLint — e.g. `eqeqeq` flagged `== null` (the
idiomatic null/undefined check); consider the `{ null: "ignore" }` option, and
audit the ruleset generally. (Surfaced by a CI failure on KeyedList.js, 2026-06.)
Landed 2026-07: a husky + lint-staged pre-commit hook runs `eslint --fix` on
staged `packages/**/*.{js,jsx,ts,tsx}` (via npx — no pnpm). Still open: the
ruleset audit itself, and an ESLint v9 modernization (flat config already in
use; deps are on v8.57).
