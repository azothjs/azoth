# KeyedList — design (living doc)

> Status: stance planted (Q1, Q4), spikes pending. Flushed continuously as we
> decide. History/argument lives in the transcript; this doc states *where we
> arrived* with clear line of sight. Related: [rerenderer](./rerenderer.md),
> [VirtualList](./VirtualList.md).

## What this is

The narrow **dynamic-list specialty**: add / remove / move / update over keyed
rows, with each change keeping its delta (no reconcile-by-diff). NOT a
list-rendering abstraction — 95% of "lists" are forward-only `{items.map(row)}`
at initial render and need none of this.

## The frame boundary (the core precision)

A page's forward-only render flow builds structure and, at a `<keyed-ul>`,
**hands off to a second, self-managing render cycle.** The custom element is a
*context-frame change with a reset* — a new render cycle out of the original
flow. This is exactly why we needed it: the dynamic case falls outside
forward-only, so it gets its own frame, owned by the platform, not threaded
back into the page's render.

Two sides of one pattern, distinguished at the composition seam **by casing**
(JSX convention + platform convention, no invented syntax):

```jsx
<main>
  <PetFilter/>                  {/* Capitalized → azoth component, JS-initiated, forward-only */}
  <pet-adoption-dashboard/>     {/* hyphenated → custom element, platform-initiated, own cycle */}
</main>
```

The author reads the render flow from the spelling. That's the payoff of Q1.

## Renderer reset (the frame boundary, expressed in code)

The conceptual frame boundary has a 1:1 expression in `renderer.js`. Today the
per-site closure dispatches on `activeRerenderer()`: a rerenderer active →
`rr.getBound(siteKey, buildFresh)` (reuse DOM); else legacy `getBound()`
(fresh). Generalize the stack to hold **renderers of two kinds**, both
implementing `getBound(siteKey, buildFresh)`:

- **Rerenderer** — caches by `siteKey`, reuses DOM. (exists)
- **Renderer (fresh)** — ignores `siteKey`, always `buildFresh()`. The reset.

Rename `activeRerenderer` → **`activeRenderer`**; the closure becomes uniform
(polymorphism handles the dispatch — a fresh Renderer's `getBound` just builds):

```js
const r = activeRenderer();
if (r && create) ({ node: root, bind } = r.getBound(siteKey, buildFresh));
else ([root, bind] = getBound());   // legacy path, removed when blocks migrate
```

A `<keyed-ul>` **pushes a fresh Renderer** around its internal render (in
`connectedCallback`). Consequences:
- the page's outer rerenderer is **shadowed** — it cannot reach into the
  element's internals. This is Q4 (pure platform) enforced at the renderer level.
- rows build fresh by default; per-row, KeyedList pushes a per-row **Rerenderer**
  for `update()` — nests cleanly on the same stack.
- **de-risks the load-cycle timing:** because the element pushes its own frame,
  it no longer matters *when* `connectedCallback` fires relative to the page
  render — the outer stack state is shadowed either way.

**Third word? No.** Two concepts span it — Renderer (new DOM) / Rerenderer
(reuse). The "reset" is just a Renderer pushed to shadow; not a third kind. The
candidate third concept would be a **rerender-nothing barrier** — something that
*blocks reuse without itself reusing*. But that is exactly what a fresh Renderer
is: it renders new DOM and, by sitting on top of the stack, blocks the outer
rerenderer's reuse. (Precisely: not *render*-nothing — it does render fresh DOM;
it *rerenders* nothing.) A pure produces-no-DOM barrier has no use we can see.
Subtract to unlock — two words.

## Stance (decided)

- **Q1 — tag:** hyphenated **`<keyed-ul>`**, platform-upgraded custom element.
  Not `<KeyedUL>` (azoth component): a custom element is `HTMLElement`-derived
  with the platform's connected/disconnected lifecycle; routing it through
  azoth's JS-initiated init/render/update protocol puts the two flows in
  conflict. Hyphenated keeps it purely platform.
- **Q4 — compose:** once defined, the element **leaves azoth compose entirely.**
  Lifecycle is 100% platform (connectedCallback = initial render; ops = imperative).
- **DOM default:** light DOM, so author CSS reaches rows (the
  `[data-selected].status-adopted` view-logic). Shadow DOM is legitimate —
  guidance, not law: use it for isolation, reach rows via `::part`/custom props.
  - *Reminder (matters for CSS):* a custom element is just **markup** — it sits
    in the template HTML, gets cloned, and the platform upgrades it on insertion
    (same as any element; see Bootstrap). Because it's real markup in light DOM,
    author CSS styles the element and its rows normally — no special render
    layer between the stylesheet and the rows. That's the floor under
    CSS-as-view-logic.
- **Two orthogonal axes** (never crossed):
  - *Presentation* — an abstract base **`KeyedList`** (shared ops; `extends
    HTMLElement`; **NO tag, NO define** — the extend target) with concrete leaves
    **`KeyedUList`/`KeyedOList`/`KeyedTable`** (the finite keyed set), each its
    OWN module with its OWN `define`. Author `extends` a leaf (semantic) or
    `KeyedList` itself (raw/custom) and `define`s their own tag. The define-free
    base keeps each leaf's registration isolated. See *Bootstrap & module layout*.
  - *Source* — bridges a data source → ops (`SupabaseController`, …), attached by **composition**.

## Authoring story (code-smith, pre-spike)

Domain element extends a presentation base; the row template + key are its
declaration; the source is wired wherever the author likes.

```js
class PetAdoptionDashboard extends KeyedUL {   // KeyedUL derives KeyedList; fixes <ul>/<li>
    constructor() {
        super();
        this.key  = pet => pet.id;                                                  // function-valued props (thunks):
        this.view = pet => <li class={`pet status-${pet.status}`}>{pet.name}</li>;  // the row's rerenderable
    }                                          // constructor: once. connected/disconnected: cycle.

    connectedCallback() {
        super.connectedCallback();   // base pushes a fresh Renderer frame, guards the once-render
        // source wired in JS (pattern 1/3) — no rich JSX props needed
    }
}
customElements.define('pet-adoption-dashboard', PetAdoptionDashboard);
```

Constructor for definitions, `connectedCallback` for the cycle: the thunk forms
(`renderer(props => …)`) *define* a function that runs JSX without instantiating
— for a custom element the constructor is the honest once-place for that
(`key`, config), since connected/disconnected cycle through repeatedly. The
constructor only *stores closures* (no DOM, no attribute reads → within WC
constructor rules); the JSX runs later, under the element's own fresh frame.

### Source patterns (author's choice — all legitimate)

```js
// (1) module-level direct — realtime self-drives; you don't notify it, it notifies you
const pets = supabase.channel('pets');
connectedCallback() {
    super.connectedCallback();
    pets.on('postgres_changes', {event:'INSERT'}, ({new:p}) => this.add(p))
        .on('postgres_changes', {event:'UPDATE'}, ({new:p}) => this.update(p.id, p))
        .on('postgres_changes', {event:'DELETE'}, ({old:p}) => this.remove(p.id))
        .subscribe();
}

// (2) injected at composition — <pet-adoption-dashboard prop:source={getRef()}/>
set source(ref) { this.#ctl?.dispose(); this.#ctl = new SupabaseController(ref, this); }

// (3) pushable — minimal driver, "all you need to turn the wheel"
const [pets$, push] = pushable();
connectedCallback() { super.connectedCallback(); (async () => { for await (const p of pets$) this.add(p); })(); }

// (4) events — DOM-native, fan-out for free
this.addEventListener('pet:adopted', e => this.update(e.detail.id, {status:'adopted'}));
```

### Ops (verbs)

`add(...items)` (variadic, append-like, for inline/few) **and** `addAll(items)`
(an array, the bulk path) · `update(key, data)` · `move(key, index)` ·
`remove(key)` · `clear()` · `has(key)` · `get(key)` · `size` · `keyAt(target)`.

Why both `add` and `addAll`, not variadic-only (`add(...all)` mirroring
`element.append`): a list is the **big-N** case — `add(...10_000)` risks
argument-count limits, which `addAll(array)` sidesteps. And variadic-only has an
**LLM footgun**: `add(rows)` (forgetting the spread) silently adds *one* row
whose data is the array, rather than erroring — and we can't guard it without
breaking the legitimate "a row whose data is an array" case. So `addAll` stays
as the safe, unambiguous bulk door; `add(...items)` gives the append feel for
inline use. (This is the resolution of the earlier `add(oneOrMany)` ambiguity.)

### Controller contract (source axis)

```js
class SupabaseController {
    constructor(source, list) { /* subscribe; map events → list.add/update/remove */ }
    dispose() { /* unsubscribe — pair to disconnectedCallback */ }
}
```

This is a **contract** (a shape the author/library implements), not a built-in —
**azoth ships no controller.** Per "no general problems," specific controllers
(Supabase, WebSocket, …) are examples/recipes; one is promoted to library code
only if a genuinely reusable shape emerges. The integration mechanism is
author-defined by design.

## Bootstrap & module layout (the hand-off seam)

The tricky part of pure-platform: **a hyphenated tag in the template is just a
string.** `<keyed-ul>` compiles into the template HTML with *no JS reference* to
the class — unlike a Capitalized `<KeyedUL/>` component, which compiles to the
imported identifier (a binding the bundler tracks). So the bundler sees **no
link** from the tag to the class module. The element upgrades only if
`customElements.define('keyed-ul', …)` has run.

**The define side-effect IS the hand-off.** Something must run `define`; using
the tag doesn't pull it in. Consequences:

- **Author must import the defining module.** Either the `extends` does it
  (`class X extends KeyedUL` references `KeyedUL` → its module is kept → its
  `define` runs), or — for raw `<keyed-ul>` use with no subclass — a side-effect
  import is required. Forgetting it = a silent inert element (no upgrade). This
  is a real footgun and a first-class LLM-affordance/docs point.
- **Treeshaking:** package `sideEffects` must protect the per-element modules so
  `sideEffects:false` can't drop a `define` whose class binding looks unused
  (the raw-tag case). The `extends` case is naturally safe (binding is used).

**Module layout (driven by treeshaking):**

```
KeyedList       abstract · shared ops · NO define · the extend target  (shared module)
 ├─ KeyedUList  → define('keyed-ul')     own module
 ├─ KeyedOList  → define('keyed-ol')     own module
 └─ KeyedTable  → define('keyed-table')  own module
```

The base is **abstract on purpose:** if `KeyedUList` extended a *concrete*,
self-defining list, importing `keyed-ul` would drag that element's `define` in
too — a leak. A **define-free** base means importing one leaf registers only its
own tag. (Extending the base directly is even leaner — no ride-along at all.)

**Only three keyed elements** — `ul`/`ol`/`table`. The rest (`dl`, `menu`,
`select`, `datalist`) are typically initial-render-only (forward-only `map`), so
they get no keyed leaf; an author needing a dynamic one `extends KeyedList`
directly. (`dl`'s two-element items — `dt`+`dd` — also break the single-root-row
model, an extra reason it's not a default leaf.)

**Registration:** leaves self-`define` their canonical tag, **idempotently**
(`if (!customElements.get(tag)) define(tag, cls)`) so a double-load can't throw.
The author always `define`s their *own* tag for their subclass — `extends
KeyedUList` gives `keyed-ul` along for the ride (one negligible registry entry,
the cost of single-import) plus the author's `define('pet-dashboard', …)`. Chosen
over a `KeyedUList.define()` method, which would split into two import styles
(extend vs register-for-raw-use) to save one trivial registry entry.

**Class casing — mirror the DOM stems:** `KeyedUList`/`KeyedOList`/`KeyedTable`
(echo `HTMLUListElement`/`HTMLOListElement`/`HTMLTableElement`, minus the
redundant `…Element`). On-mission (azoth mirrors the platform) and consistent
(all `Keyed`+noun). Tags stay short + lowercase — `keyed-ul`/`keyed-ol`/
`keyed-table` — class name and tag are independent. `KeyedUL`/`KeyedOL` is the
terser alternative; the full `…Element` mirror is overkill.

## Status

- **GREEN (first increment).** `KeyedList` base + `KeyedUList` leaf implemented
  (`packages/maya/blocks/`); both author-first tests pass; valhalla 59/59, maya
  143/143, no regressions. Snapshots:
  `<pet-list><ul><li>Felix…</li><li>Mittens…</li></ul></pet-list>` and, after
  `update(1, Felicia)`, `<li>Felicia…</li>` with Mittens untouched.
- **Q3 empirically confirmed:** `expect(after).toBe(before)` passed — `update`
  rebinds the row IN PLACE (same node) via its per-row rerenderer. Not just
  reasoned now; observed.
- **Fresh-Renderer frame: deferred, possibly moot.** Green with NO `renderer.js`
  change: the container is built with `document.createElement` (no rerenderer
  involvement) and each row's rerenderer self-pushes/pops, so the element's
  internals never consult an outer rerenderer. The frame reset / `activeRenderer`
  rename is robustness for the *nested-inside-a-rerenderer* case — a nested-usage
  test would settle whether it's ever needed. Subtract candidate. **TODO: write
  that nested-usage test.**
- **Separate concern — the outer rerenderer updating the element's PROPS** (not
  reaching into its internals). If the author binds a dynamic prop on the
  element, the outer rerenderer re-assigns it on re-render:
  `<keyed-ul source={dynamicRef} id={selector}>`. The element must *handle* the
  update — **author responsibility, by design** (controlled component). Pattern,
  mirroring Channel's same-source no-op:
  ```js
  set source(next) {
      if(next === this.#source) return;   // idempotent: identical ref, no-op
      this.#ctl?.dispose();                // teardown
      this.#source = next;
      this.#ctl = new SupabaseController(next, this);  // setup
  }
  ```
  *Guidance:* if you expose a prop on a keyed element that an outer rerenderer
  will rebind, your setter must handle the update (idempotent + teardown/setup).
  Not gating; exercise when we add dynamic-prop tests.
- **vitest `-u` coalescing bug RECURRED — without `/* HTML */`.** On `-u`, both
  snapshot values were written onto test 1's call (test 2's left empty). Trigger
  appears to be the `//` comments adjacent to the snapshot lines (the greedy
  comment-skip), NOT the `/* HTML */` marker. Contradicts CLAUDE.md's
  "regeneration-safe regardless of vitest version" — present in 4.1.8. Worked
  around by placing the (vitest-generated) values by hand. Needs a call: strip
  adjacent comments for `-u`-safety, or check the upstream fix's status in 4.x.
- **Q3 (per-row rerenderer): CONFIRMED.** `rerenderer()` mints a `new Rerenderer()`
  per call with a per-instance `#sites` cache; `Map<key, rerenderer(view)>` gives
  each row an independent instance, so the same `view` (same `siteKey`) can't
  collide across rows, and `update(key,data)` rebinds in place. Existing tests
  cover ordinal (single-instance loop) + multi-site/single-instance; the per-row
  multi-instance path is structurally guaranteed and now covered by the
  author-first test.
- **Author-first test:** `packages/valhalla/keyed-list.test.tsx` — the stance,
  RED until `KeyedUList` implemented. Drives the build.
- **New constraint surfaced (author-first working):** the JSX form `<pet-list/>`
  needs a custom-element **IntrinsicElements** declaration in the JSX types, or
  it's a TS error. The first test sidesteps it via `document.createElement`;
  wiring custom-element JSX typing is the next author-first increment.
- **Base typing lands WITH the implementation** (`.d.ts` or JSDoc on the
  `KeyedList`/`KeyedUList` source, per maya's convention) so valhalla
  typechecks rather than red-on-missing-type.
- **Module home rename is a POST-impl refine, not an early gate.** `blocks` is
  legacy (KeyedBlock vocabulary); the new name settles during the legacy-cleanup
  increment that *follows* the implementation — which also removes
  `Controller`/`Updater` + the injectable/`getBound` path in `renderer.js` (the
  KeyedList-on-Rerenderer migration is what frees them). Renaming an export +
  one import under green tests is a one-line refactor; deferring costs nothing,
  nailing it early bikesheds the layout before we know what lives where.

## Spikes (the gate before author-first tests)

1. **Prop kind + timing (Q2) — INVESTIGATED, partial Red.** thoth codegen:
   static value → attribute baked into the template; dynamic value →
   `resolveDynamic(name, tag)` picks property-vs-attribute **by name, with no
   custom-element special-casing.** A *known* DOM property name → property
   assignment (good). An *unknown* name (`source`/`row`/`key` on `<keyed-ul>`)
   → `setAttribute(name, value)` → **a rich value (ref/fn) stringifies to
   `"[object Object]"`. Broken.** No way to force property for an unknown name
   today — this is the TODO's "attribute vs property" gating issue surfacing here.
   - **Consequence — the constructor/class authoring sidesteps it entirely:**
     `key`, `present()`, and JS-wired sources never travel as JSX props, so the
     broken path is never taken. ✓ This finding *validates* the class-based stance.
   - **Only JSX-injected source (pattern 2) is blocked** → needs a force-property
     syntax (`prop:source={ref}`), which is pre-existing needed surface (attr/prop
     table work). Halt that sub-thread; patterns 1/3/4 are clear. (String-
     identifiable sources, e.g. `source="pets"`, work today as a string attribute.)
   - Timing: `renderer.js` `buildFresh()` clones → binds → *then* the caller
     inserts, so props are set on a **not-yet-upgraded** element (a detached
     clone isn't upgraded until connected). Assigning `el.view = fn` pre-upgrade
     sets an own data property that **shadows the prototype setter** installed at
     upgrade → setter never fires. Classic WC trap.
   - **Resolution (two small, general fixes — not KeyedList hacks):**
     (a) make dom-info `resolveDynamic(name, tag)` **tag-aware** — a hyphenated/
     custom tag + unknown name → `kind:'property'` (NOT uniform dynamic→property,
     which would break intrinsic force-attribute cases: aria/data/SVG/enumerated).
     `makeBind` then emits `t.view = v`. One spot; no new channel; no runtime change.
     (b) **lazy-property-upgrade** in the `KeyedList` base `connectedCallback`
     (cache own value, delete, re-set through the accessor). Standard pattern.
     Together these make `<keyed-ul view={petRow} key={byId}>` work — JSX-settable
     rich props for ANY custom element, which is azoth correctly supporting the
     platform. Needed only for JSX-injected props; constructor wiring needs neither.

### Creation channel — no `createCustomElement` needed

`METHOD = ['', '__c', '__cC', '', 'Object.assign']`: `__cC` (composeComponent)
is for **capitalized** JSX components; `__c` is child compose. A hyphenated
`<keyed-ul>` is neither — it's **plain element markup baked into the template
HTML**, instantiated by clone + upgraded by the platform. The *only* runtime
touch is `BIND.PROP` for its dynamic props (the fix above). So Q1 (hyphenated)
is exactly what lets a custom element ride the element path: no new compose
channel, no component protocol — pure platform.
2. **Rerenderer per-row (Q3)** — can `rerenderer(rowFn)` instantiate
   imperatively, one per row, same `row` fn, keyed in a Map? *Likely already
   de-risked* by recent `rerenderer-per-row keyed` + `module-factory … returned
   closure is the rerenderable` work — confirm the contract holds for the
   imperative use.
3. **Registration + load cycle + template inclusion** — `<keyed-ul>` rides in
   azoth's compiled `<template>`. Platform baseline: template `.content` is
   inert (separate document) — custom elements inside **don't upgrade while in
   the template**; they upgrade on *insertion* into the live document (or at
   `define()` time if already inserted). So upgrade + connectedCallback fire as
   the cloned fragment lands in the tree. Spike confirms azoth's clone/insert
   path matches, and measures the load-cycle cost (a heavy connectedCallback —
   subscribe/fetch — fires during initial render).

## Open forks

_Resolved this round:_ **auto-define (idempotent)** over explicit `.define()`;
generic `<keyed-list>` leaf **dropped** (abstract `KeyedList` IS the extend
target); keyed set = **`ul`/`ol`/`table`**; class names **mirror DOM stems**
(`KeyedUList`/`KeyedOList`/`KeyedTable`).

_Resolved earlier:_ layering → abstract base + per-leaf define modules; row-fn
name → **`view`** (function-valued prop); composition casing → **hyphenated**
(marks the render flow); pure-platform creation (no `createCustomElement`).

## LLM affordance (why the small surface wins) + eval framing

A model already knows custom elements, DOM, CSS, lifecycle. Docs mark the
*deltas*, not the platform: (1) name the owned construct — JSX is a DOM Literal;
(2) annotate only azoth-specific bits in examples; (3) pattern library =
additive, discoverable, one file each (`name · when · minimal JSX+JS ·
snapshot`); (4) the controller contract is a stamped shape. **Eval reframe:** a
pattern's definition-of-done is "given a realistic prompt, does the model reach
for it?" — patterns are eval targets, not just docs.
