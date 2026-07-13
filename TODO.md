# Azoth TODO

## Release

2.0.0 is prepped; the publish flow lives in [RELEASING.md](RELEASING.md).
Post-publish, Marty: deprecate `@azothjs/chronos` + `@azothjs/vite-plugin`
on the registry (pointers to azoth 2.0 / `@azothjs/thoth/vite`).

Post-2.0 backlog:
- Generated `.d.ts` for maya/thoth (tsc JSDoc emit) — jsx.d.ts is
  self-contained until then.
- `sideEffects` fields (maya/lists registers custom-element tags on import —
  needs a careful array, not a blanket `false`).
- `engines` (maya uses `Promise.withResolvers` → node >= 22 when run in
  node; browsers fine — decide whether to signal).
- Release GitHub workflow (changesets action) if/when publishing moves off
  the laptop.
- vite-test refresh (still on vite 5 / vitest 1; not in the workspace —
  parked separately).

## Rerenderer / lists

- **Rerenderer naming bikeshed** (Rerender vs Rerenderer) — NOTE: publishing
  2.0 semver-locks the exported name. Decide before `pnpm release` or accept
  `rerenderer`.
- **VirtualList** (recycled-pool / virtualization, FUTURE, separate block) —
  `docs/design/VirtualList.md` + `frame-primitives.md`.
- **Init→update worked examples** (module-factory / class / object
  UIComponent / plain render fn against realistic UI-layout management) —
  absorbed into the articles series (article two: enhanced composition; see
  `docs/articles/README.md`).

## Channel

- **Author-initiated cancel** — slot-lifecycle teardown landed (compose
  cancels a live source on clear); what remains is an author-facing
  `AbortController`/`cancel` prop to release upstream resources (open
  WebSockets, fetches) without a swap. Defer until a real-world need
  surfaces.
- **Role evolution (decision record)** — Channel = orchestrator + transformer
  in one; the `<Anchor>` + `channel()` split was considered and REJECTED
  2026-06-11 (the flat form degrades gracefully into the split once async
  iterator helpers land; the reverse breaks). Revisit only when source
  transforms are native (~2027-28). Full reasoning in git history.
- **SoC example** — "module exports a Channel, consumer slots it into any
  DOM" (search + paging + results in one module, Channel out) deserves a
  worked example — articles series or a valhalla test.

## Components / typing — precision pass (follow-on)

Foundation landed (Composable union, ElementType, UIComponent/Component
split, childNodes pinned as `Node | undefined`, structural render member).
Remaining depth, on-demand:

- **`Composable` last gaps** — Observable-shaped (`.subscribe`) and the
  `IGNORE` sentinel; `as unknown as JSX.Element` casts persist in
  `channels.test.tsx` (observable-in-slot) and `rerenderer.test.tsx`
  (module-factory return).
- **`<Channel>` props are `any`** — type the constructor (JSDoc on Channel);
  unlocks `new Channel({…})` and `<Channel …>` prop checking (`eventType` ⟺
  EventTarget, `map` ⟺ array source, `error`/`as` return match).
- **Per-form prop typing** — render-object, class-/function-component
  surfaces; `@template`/conditional types vs per-component `.d.ts` — open.
- **Findings from component-forms.test.tsx** (each carries an `as any` +
  comment in the test):
  - Nullable tag: `const C = cond ? null : Cat; <C/>` → TS2604 despite
    ElementType including null.
  - children synthesized into props: `ElementChildrenAttribute` makes TS
    demand `children` in a component's PROPS type, but azoth delivers arg-2.
    Options: drop ElementChildrenAttribute, a helper type, or untyped props
    on children-taking components.
  - Object-as-tag: `{ initialize, render, update }` literal as a tag →
    TS2604; TS wants a call/construct signature.
- **`Component.initialize?` optional vs required** — stricter contract vs
  the current lenient runtime (`initialize?.()`) — decide together.

## Compose

- **Class components returning null** — arrow-null and null-as-component are
  pinned (render nothing — `component-forms.test.tsx`); the open wart is a
  class whose constructor body `return null`s: JS yields the instance anyway
  (no render → throws). Align so `return null` means "render nothing" in
  every form, or document the class-form exception.
- **withAbort ↔ pushable** — should `pushable` return `[results$, push,
  cancel]` so abort is exposed there too, or stay minimal (compose/Channel
  own cancellation)? The shared `aborted()` collapse is done
  (`compose/abort.js`); teardown timing is pinned (`channel.test.js` — lazy
  subscribe, prompt abort). Revisit if a real consumer needs cancel-at-push.

### Performance research (parked)

`compose` is the hot path. Older lore said "call functions with consistent
arity for V8 perf" — no longer true (V8 8.9 removed the adaptor frame).
What still matters: hidden-class/shape stability, monomorphic ICs, function
size vs inlining thresholds, avoiding mid-flight shape changes. Park until a
real regression motivates the work.

Harness direction (not a release gate): wire into krausest's
js-framework-benchmark — KeyedList maps onto its rows model; numbers are
corpus-standard. A martypdx fork exists (gh + another user account on this
laptop), ~2 years stale; needs a rewrite against current azoth.

## Platform tracking (informational)

- **Async iterator helpers** (Stage 2, est. 2027-28) — Channel's pipeline
  props (`as`/`map`/`error`) become optional sugar once
  `source={events$.map(Notification).catch(ErrorBanner)}` is native. Both
  forms stay valid. See Channel role evolution.
- **DOM Parts** (WICG, early incubation) — azoth's compiled binders are
  "DOM parts in a part group" (`docs/design/rerenderer.md`); working
  evidence to offer the proposal conversation. Consider a position write-up
  once 2.0 ships.
- **WICG Observable + `EventTarget.prototype.when()`** — Chrome 135+
  shipped; Firefox implementing. When `when()` is broadly available, our
  `fromEventTarget` bridge becomes a polyfill (Observable-shaped sources
  already flow through `.subscribe` detection). Track adoption.

## dom-info (`packages/thoth/dom-info/`)

Browser-validation suites are on-demand (`pnpm test:validate`), not in CI.
Open:
- Gate `test:validate` into CI only for changes touching
  `packages/thoth/dom-info/**` or the data-package deps.
- A "deps current?" signal (renovate or scheduled `pnpm outdated`) for when
  re-validation + regeneration is due.
- No dom-info README yet — document data sources + the validation workflow.

## External (not Azoth code)

- **Vitest inline-snapshot updater, bug 1** (comment-adjacent coalescing) —
  4-char fix applied locally via `pnpm patch`
  (`patches/@vitest__snapshot@4.1.8.patch`); upstream PR still to be opened
  from the martypdx fork. Drop the patch once it lands and we bump.
- **Vitest inline-snapshot updater, bug 2** (same-test/many-snapshot
  mis-assign; spike) — `-u` lands values on wrong calls. BROWSER MODE is
  worse: many-at-once fills coalesce, and one-at-a-time via `-t` offsets by
  executed-test ordinal (node-env fills are fine). Workaround in use: probe
  assertion → harvest → freeze to `toBe`/`toEqual` (valhalla convention).
  Fold both into one upstream issue/fix.

## ESLint (lower priority)

Ruleset audit (e.g. `eqeqeq` vs idiomatic `== null` — consider
`{ null: "ignore" }`) and ESLint v9 modernization (flat config already in
use; deps on v8.57). The pre-commit hook (husky + lint-staged) is in place.
