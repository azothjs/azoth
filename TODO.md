# Azoth TODO

## Rerenderer (2.0 centerpiece — design captured, pre-spike)

Design: `docs/design/rerenderer.md`. Re-execution + identity-keyed
cache; per-call-site factories (closure identity as key); ordinal reuse
for loops; lists-shrink-branches-sleep prune rule; narrowest-scope
convention (components run once and RETURN their rerenderable);
per-type update dispatch in compose. Spike order in the doc's open
questions. Naming bikeshed (Rerender vs Rerenderer) deferred.

Related blocks decision: KeyedBlock renames to **ListBlock**
(js-framework-benchmark holdover name). AnchorBlock remains a cut
candidate; Toggle TBD.

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

### DOM Parts (WICG, early incubation)

Azoth's compiled binders are literally "DOM parts in a part group"
(see docs/design/rerenderer.md). The proposal space is early with
multiple competing drafts — Azoth has working evidence (compiled
part-groups + the Rerenderer's apply-values mechanism) to offer the
direction conversation. Watch the repo; consider a position
write-up once 2.0 ships.

### Rerenderer follow-ons

- Controller/Updater likely removable once blocks migrate onto
  Rerenderer (legacy injectable path in renderer.js goes with them).
- ListBlock may need variant behavior — or simply swaps a rerenderer
  in per row. Decide during the blocks increment.
- Valhalla API-level rerenderer tests (JSX-driven, crazy scenarios)
  once increments (b)+(c) land — that's where confidence accrues;
  refine code after.
- `stopRerenderer` (name TBD): a way, within a rerenderer path, to toggle
  the flow back to create-new-DOM mode for a subtree — opt out of reuse
  where each call should mint fresh nodes. Future feature; design open.
- Teaching: the rerenderer *mechanism* doesn't need corpus budget — it's
  init-then-update, a plain JS/CS pattern (module factory, class
  constructor/render, object initialize/render) LLMs already know; the
  rerenderer just links it to JSX-as-DOM. What needs examples is tying
  those patterns to real-world UI layout management. Write those for the
  docs (component-as-module-factory, class/object UIComponent, plain
  render fn — each shown in a realistic layout), not mechanism explainers.

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

## dom-info

### Browser-validation suites — on-demand, not in CI

dom-info's `dom-props` / `events` / `svg` suites probe the pinned Chromium
to confirm the lifted platform data still matches. They're excluded from
the default run (`pnpm test`) and run on demand via `pnpm test:validate`
(`VALIDATE=true`). They change only on a dependency or Chromium bump.

Open follow-ons:
- Wire `test:validate` into a CI job gated to PRs/merges that touch
  `packages/dom-info/**` or bump the relevant deps (property-information,
  html/svg-element-attributes, html/svg/mathml-tag-names, playwright) —
  rather than every push.
- A "deps current?" check (renovate, or a scheduled `pnpm outdated` on
  those packages) to signal when re-validation + data regeneration is due.
- dom-info has no README yet; document the data sources + validation
  workflow when the package is readied for standalone publish.

## External (not Azoth code)

### Vitest snapshot bug — fix applied locally; upstream PR still open

A 4-character non-greedy regex fix to vitest's inline-snapshot updater
(`@vitest/snapshot`, coalesces snapshots after a comment). Now applied to
this repo via `pnpm patch` (`patches/@vitest__snapshot@4.1.8.patch`) since
the martypdx fork is vitest 5.0-beta (a major ahead of our 4.1.8). The
upstream PR (martypdx fork) is still to be opened; drop the patch once it
lands and we bump. See `OVERNIGHT-NOTES.md` for the original discovery.
