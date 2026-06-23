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

## Attribute vs property table (2.0 release-gating)

Azoth currently does nothing here — WYSIWYG. Static JSX values compile
into the HTML template string (attributes); dynamic values are applied
as property assignment. So `class="x"` works but `class={x}` silently
sets a useless expando property. Everyone will hit this.

Plan (synthesized from two research passes, 2026-06-11):

1. Seed a curated table from the frameworks that already paid this tax:
   - Solid dom-expressions `constants.js` — most explicit; booleans,
     tag-scoped PropAliases, Properties, SVGElements, namespaces
   - Vue `shouldSetAsProp` — force-attribute traps that break the
     `in el` heuristic (`form`, `list`@input, media `width/height`,
     `sandbox`@iframe, enumerated attrs like `contenteditable`)
   - Svelte `utils.js` — architectural template (only framework with
     Azoth's compile-to-HTML-template-string shape). Critically:
     `NON_STATIC_PROPERTIES` (`autofocus`, `muted`, `defaultValue`,
     `defaultChecked`) — attrs that cannot live in a cloned template
     string even when static. Azoth needs this category first-class.
2. Merge dom-info's curated corrections (~/dev/azothjs/dom-info):
   `allowFullscreen` casing, lowercase `autocomplete`, attrOnly buckets.
   Fix dom-info's line-148 bug first (`notYetImplemented` missing
   `[attr]` — guard always true, global-attr assertions silently
   skipped), then re-run the 4-browser audit as validation.
3. Output: one compiler-consumed table — JSX name → static-HTML-attr |
   property | setAttribute | boolean | SVG-namespace (setAttributeNS
   for xlink/xml) | non-static.
4. Design wins that fall out: `class` AND `className` both work (static
   compiles to HTML = no FOUC; dynamic applies via JS); SVG correctness.
   Also: custom elements / web components need validation cases —
   they're intrinsic to azoth (tag in template HTML, props are binds);
   the table's custom-element rule (property-if-setter-else-attribute
   per the framework survey) needs explicit test coverage.
5. Dropped: @webref extraction pipeline. Reflection rules live in spec
   prose, not IDL; tables are ~40-80 names total. Curated + empirically
   audited beats generated here. webref may return as part of the
   property-information upstream contribution.

Related: reply to wooorm's open question on property-information #21
(he asked whether dom-info's browser-audit should be pulled into his
project, Feb 2025, awaiting Marty's answer). Comment first; PR if
receptive; Azoth doesn't wait on the outcome.

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
- **composeStream's hardcoded `keep`** — a direct `{aStream}` value composes via
  `composeStream(anchor, stream, true)` — always accumulate. Sensible default for
  a chunk stream, but now that Input carries `append`, reconsider: should a
  direct stream honor compose's `keep`, and should Input-`from`-a-stream route
  through pipeTo (composeStream) instead of for-await (composeAsyncIterator)?

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

### Downstream: wre-dashboards migration to 2.0

wre-dashboards consumes published `azoth: ^1.4.5` from npm — NOT a file
link. It is insulated from the branch merge AND from the 2.0 publish
(caret ranges don't cross majors). Migration is a deliberate opt-in on
its own schedule, against the published 2.0.

What migrates when it does:
- `azoth/chronos/channels` imports (AiAnalysis.jsx and adjacent) →
  `azoth/maya/channels`
- `AgentSearch.jsx` line 14: `generator as stream` from
  `azoth/chronos/generators` → `pushable` from `azoth/maya/channels`
  (transform moves to the call site or Channel.as)

This migration doubles as the validation pass for the 2.0 migration
story — first real consumer upgrade.

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

## ESLint usage review (lower priority)

Revisit how azoth configures ESLint — e.g. `eqeqeq` flagged `== null` (the
idiomatic null/undefined check); consider the `{ null: "ignore" }` option, and
audit the ruleset generally. (Surfaced by a CI failure on KeyedList.js, 2026-06.)
Landed 2026-07: a husky + lint-staged pre-commit hook runs `eslint --fix` on
staged `packages/**/*.{js,jsx,ts,tsx}` (via npx — no pnpm). Still open: the
ruleset audit itself, and an ESLint v9 modernization (flat config already in
use; deps are on v8.57).
