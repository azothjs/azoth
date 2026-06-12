# Rerenderer — design (pre-spike)

Captured from design dialogue 2026-06-11/12. Status: design settled
enough to spike; open questions listed at bottom.

## Framing

The browser gives you `<template>` and `cloneNode`, but no way to apply
new values to a rendered instance. Template Instantiation (Apple, 2017)
proposed it and stalled; DOM Parts is incubating. Every framework
hand-rolls this gap. The Rerenderer is Azoth's answer: **specify a
template, apply new values, no imperative updates** — the talk slide
already names it: "Selective re-render: new props, same DOM."

It is missing browser functionality, built deletable (see MYTHOS.md —
the deletion calendar).

## The mechanism: re-execution + identity-keyed cache

Not record-and-replay. Not manual per-fragment handles. The wrapped
expression re-executes as ordinary JavaScript — control flow stays in
charge — and each template factory call consults an ambient cache for
"do you have my instance?"

The hooks coin: React re-executes and consults a cache keyed by **call
order**, so control flow around hooks is forbidden. Azoth re-executes
and consults a cache keyed by **site identity**, so control flow just
works. React caches the data and rebuilds the view; Azoth caches the
view and re-flows the data.

Mechanics:

- The Rerenderer instance is what goes on the ambient stack (the
  existing push/try-finally/pop discipline in renderer.js survives;
  what was wrong before was the payload — a bare node with one-shot pop
  and no identity check, not the stack itself).
- `getBound()` peeks the stack. If a rerenderer is present, it asks
  `rerenderer.getNode(create, key)`: cache hit → stored node + bind;
  miss → run `create()`, store by key, return.
- Conditionals work by construction: the branch that runs presents its
  key; a never-seen key is a miss → create-and-cache. Both branches end
  up resident, each behind its own key.
- Nested rerenderers push themselves; their subtree consults them, not
  the parent. (Their stability across parent passes is handled by the
  scope convention below — parents don't re-execute component bodies.)

## Keys: per-call-site factories (closure identity)

Problem: templates dedupe by content hash. Two JSX expressions with
identical HTML share one template id — an id-keyed cache would hand
site B the node cached for site A. Exhibit:
`packages/thoth/playground.test.js`, "dedupe collision" scenario:

```js
const a = t15aa2705(x);
const b = t15aa2705(y);   // same factory, same id
```

Solution: thoth emits **one factory declaration per call site**,
suffixing duplicates within a module:

```js
const t4a104a2a0 = renderer("4a104a2a", g356056d3, bac4750db);
const t4a104a2a1 = renderer("4a104a2a", g356056d3, bac4750db, 1);
```

Every `renderer(...)` call creates a fresh closure, so **the factory's
own identity is the cache key**. No instance protocol in the runtime;
no string-key composition; cross-module collisions impossible by
construction. The numeric arg is a debug label at most.

Dedupe stays in full effect: html, targets (`g…`), binders (`b…`) are
all still shared. The factory line is a one-line manifest of shared
parts. Twenty identical `<p>{x}</p>` shapes = twenty manifest lines,
one set of heavy assets. Bundle-size concern here is premature
optimization.

Also: inline `templateRenderer` into `renderer()` while in there — the
extra HOF layer buys nothing.

## Loops: ordinal reuse (tier 2 of 3)

Same site, N occurrences in one pass (`items.map(item => t(…))`).
Cache key extends: **primary = call site, secondary = occurrence index
within the pass.** Same lookup-or-create. Always in order — no
swapping, no node matching.

The principle that makes this legal: reconciliation **infers** identity
(matching algorithms — Azoth refuses); ordinal reuse infers **nothing**
(position is position); ListBlock makes identity **explicit** (author
provides keys). Azoth never guesses identity — it either ignores it or
is told.

The three tiers:

1. **No rerenderer** — mapped async source produces fresh DOM every
   emission. Honest default.
2. **Rerenderer** — ordinal reuse. Reasonable, cheap, zero inference.
3. **ListBlock** (rename of KeyedBlock — that name was a
   js-framework-benchmark holdover) — explicit keys, real list
   management: add/remove/update/swap by identity.

Documented artifact of tier 2: DOM-held state (focus, input value,
in-flight transitions) stays with the position while data flows past.
Classic unkeyed behavior; strictly better than tier 1; the doc sentence
points at ListBlock.

## Prune rule: lists shrink, branches sleep

At pass exit the rerenderer knows each site's occurrence count:

- **count > 0** — site participated → truncate its cache to count.
  Lists shrink correctly. (DOM removal is not the rerenderer's job —
  compose's replace semantics already clear the slot; pruning is cache
  hygiene.)
- **count == 0** — site didn't run → **sleeping, not dead**. Retain.
  This preserves conditional-branch resurrection.

Memory bounded by max-ever occupancy per site; dies with the instance.
Future: when cancel semantics land (AbortController on Channel), prune
is the natural teardown-hook site.

## Composability: a tree of render functions

The system composes by plain function composition. An app is a tree of
render functions — most are dumb presentation (`props => DOM`), usable
inside a rerenderer or not, no opt-in required. More complex functions
protect their setup by wrapping their *return* in a rerenderer.
Refetch-on-id when that's the intended behavior — re-call does it.
It's a small set of rules devs can reason through, not a framework
lifecycle to memorize. Function components are `props => DOM` by
nature, so they're wrappable as-is.

The comparative line: Svelte invented a syntax for control flow
(`{#if}`). Solid writes JS that doesn't behave like JS (`<For>`,
components that run once but look like they re-run). React forbids
control flow around hooks. Azoth: control flow just works.

DOM Parts note: the compiled binder IS a parts group —

```js
(ts) => {
    const t0 = ts[0], t1 = ts[1];
    return (v0, v1) => { __c(t0, v0); __c(t1, v1); };
}
```

is precisely "DOM parts in a part group" per the WICG repo (early,
multiple competing proposals). Azoth has working evidence to offer
that conversation; tracked in TODO platform section.

## Naming: `rerenderer` (settled 2026-06-12)

The returned function is the interface — devs name their own
(`const renderCard = …`). The factory name is what lives in the
corpus. `render` as a bare export collides hard with Solid's
`render(() => <App/>, el)` — same thunk-first signature, mount
semantics — plus ReactDOM/preact `render`. An LLM completing
`render(() => …)` will reach for a container argument.

Settled: `rerenderer`. The LLMs are dishing the code, so name for
the reader that can't be misread — and a name that faithfully
describes itself has its own kind of beauty.

## Scope convention: wrap the narrowest expression

**The armistice between re-execution and component-runs-once.** The
rerenderer never wraps a component function; the component runs once
and *returns* its rerenderable:

```js
function Component({}) {
    // setup and one-time work — runs ONCE
    const name = asyncValueStream();
    const handleClick = () => {};            // stable ref, outside the wrap

    return rerenderer(<p onclick={handleClick}>{name}</p>);
}
```

Not `rerenderer(function Component(){ … })`. Component bodies never
re-execute; only the minimal template expression does. Object refs
defined outside the wrap stay stable across passes (recreate-per-pass
is possible — it's the React pattern, not ours).

Web components are **intrinsic elements** for all of this: their tags
live in the template HTML, their attrs/props are binds, update = rebind.

## The API: higher-order function, settled

```ts
type Rerenderer = <Args extends any[], T>(
    renderFn: (...args: Args) => T
) => (...args: Args) => T;
```

A thunk/function in, the same signature out. The expression form
(`rerenderer(<p>…</p>)`) hands rerenderer an already-evaluated Node —
it throws at runtime ("you shall not pass"): `typeof renderFn !==
'function'` is the gate. Exhibit in the playground ("narrow-scope
convention" scenario): thoth compiles the JSX inside the thunk and
leaves `rerenderer(() => t47556cd8(name,salutation))` intact — exactly
the runtime's input shape.

`rerenderer(App)` is type-legal and lol. Use is meant to be as narrow
as possible — a tool in the layout-management bag. Primary use: render
functions and intrinsic elements.

## The trap, and the per-type wall

The narrow-scope convention alone cannot contain components:
`rerenderer(() => <div><Component/></div>)` hides a component inside an
intrinsic wrap. Re-execution re-evaluates the `[Component, props]`
tuple into the slot bind. So per-type update rules are unavoidable —
they're the real wall, the convention is the guidance.

`composeComponent` combines create with compose; update becomes the
third verb, dispatched per type. compose.js restructures around this
(the commented "recording/updating" scaffold at compose.js ~104-114 was
this idea reaching for instance identity via the anchor — wrong key,
right instinct; closure identity now provides it).

| In component position | Create | Update |
|---|---|---|
| function | call → walk the chain (below) | re-invoke the **cached last link** with newProps; plain-DOM returns → re-call the function (setup re-fires — the documented cost) |
| async function | call → Promise (composable) → chain stops at the function itself | re-call = re-fetch (often exactly right: new id → new fetch) |
| UIComponent (class or object literal) | class: constructor intake; pre-made instance: `initialize(props)` | `instance.update(newProps)` |
| Channel | construct | `update(newProps)` = instance-level `===` on the source ref; new ref → teardown + resubscribe (meets cancel semantics) |
| Node | **removed** — throws (landed 3dafed7). Create must actually produce something. |
| web component | intrinsic — tag in template HTML, attrs/props are binds; azoth doesn't intercept | rebind (see attr/prop TODO: custom-element validation cases) |

### The chain rule (replaces "branding")

The cached update object is **the end of the chain — the thing that
yielded something composable.** Dispatch is structural: keep calling
functions until a composable comes out; remember the last callable
link at the anchor.

```js
function CatCard({ id }) {
    const data = fetchCat(id);                 // setup — runs once
    const select = () => selectCat(id);        // stable handler
    const renderFn = rerenderer((props) =>
        <div onclick={select}>cat #{props.id} {data}</div>);
    return renderFn;                            // ← cached; re-invoked, not CatCard
}

rerenderer(props => <div><CatCard id={props.id}/></div>);
```

No brand/marker needed — position in the chain is the identity.
compose already chain-walks functions; update remembers the last link.
The component's props object flows to the cached updater as-is.

**The closure/parameter contract**: the thunk's *parameters* are the
update surface; its *closures* are the setup surface.
`(props) => …props.id…` flows; `() => …id…` is frozen at setup. This
is the explicit inverse of React's implicit re-run-everything. Future
thoth lint: warn when a closure-captured prop is used inside a
rerenderer thunk.

### create() narrows (interpolators are the gourmands)

Slots eat everything; component position eats clean. create() accepts:
**function | class | UIComponent instance | Channel | null/undefined
(no-op — dynamic `<C/>` where C is conditionally null renders
nothing).** Arrays, IGNORE, booleans, and the default-label container
dance: removed. `<Wha length={0}/>` where Wha is an array gets a
TypeError, as it deserves.

Promise-in-component-position is cut WITH its recovery idiom — lazy
components are async functions:

```js
async function LazyCat(props) {
    const { Cat } = await import('./cat.js');
    return createComponent(Cat, props);
}
```

Anything async arrives as a *return value*, where compose already
handles it.

## UIComponent: unify class and render object (subtract to unlock)

Today a class gets props twice — `new input(props, childNodes)` AND
`render(props)` via the render-object path. The unification: props
intake happens ONCE per form — classes via constructor ("component =
constructor"), pre-constructed instances (object literals) via
`initialize(props)`, which is the literal's constructor moment.
`render()` takes no args; `update(newProps)` is the change channel.
One protocol, structurally satisfied by class or literal (TS
interfaces are structural; optional methods via `?`):

```ts
export interface UIComponent<Props extends object> {
    initialize?(props: Props): void;           // intake for pre-constructed instances
    render(): Composable;                      // DOM — or a source — or a Channel
    update(props: Props): void | Composable;   // void = handled internally; Composable = replace
}
```

FINAL (ruled 2026-06-12): three methods, each doing one thing.
`initialRender` was not merged — it was **deleted**. The sync-then-
async pattern is not a protocol concern; it's a value concern, and
the value already exists: **Channel is the render pattern for
sync+async.**

```js
const profileCard = {
    initialize({ id }) { this.id = id; },
    render() {
        return <Channel source={fetchProfile(this.id)} as={ProfileView}><Loading/></Channel>;
    },
    update({ id }) { /* … */ }
};
```

Notes:
- A dual-purpose `initialize(props): Composable` (intake + first
  paint) was considered and rejected: it re-implements Channel's
  initial+source pairing inside the protocol, and the firstReplaces
  machinery would leak into protocol dispatch. Protocol and value
  compose; they never overlap.
- `props` as an interface property was REMOVED — intake is a method,
  storage is the author's business.
- `render()` may return a *source* — compose already dispatches on
  the return value's type; no `getSource()` second entry point
  (option B over option A).
- Return type `Composable` = compose's full input surface (the
  typing-review rename of DOMChild). Settled: match the runtime.
- `update` returning the same Node is a natural no-op under the ===
  skip.
- **Channel does not conform to UIComponent — it is consumed by
  UIComponents.** Channel only ever grows `update()`, for the
  in-component-position case. compose gains zero pairing machinery.

## Same-instance rebind: the === skip proposal

Re-executing a thunk that closes over an async source re-passes the
SAME object instance to the bind (`{name}` in the convention exhibit).
Recomposing a single-consumer iterator starts a second racing consumer;
recomposing a Channel re-shows its initial (flash) and races its
source. Neither is ever wanted.

Proposal: **identical value at a slot is idempotent** — if the incoming
bind value `===` the previously bound value, skip. Not diffing (no
structure inspected); the same layout instruction twice is one
instruction. This makes master/detail work for free: same source ref →
untouched; NEW source ref (detail switched) → full replace, new
subscription.

Placement options: (a) rerenderer site cache stores lastArgs, skips
unchanged positions — contained blast radius; (b) compose-level: the
anchor remembers its last input, `compose(anchor, sameValue)` is a
no-op — global idempotency, deeper change. Spike starts with (a);
(b) stays on the table as the principled end-state.

## Storage architecture (settled)

The rerenderer instance holds two caches:

1. **Factory sites** — closure identity → { node, bind, lastArgs },
   with occurrence indexing and the lists-shrink-branches-sleep prune.
2. **Anchor memory** — `WeakMap<anchorComment, { lastValue, updater }>`
   — everything that flows through slots: the === skip (lastValue),
   component-instance stability (the cached chain-end updater), and
   the future home of subscription-encapsulation for teardown (cancel
   semantics). compose consults it whenever a rerenderer is on the
   stack. Anchors are per-slot, survive rebinds, and WeakMap means
   slot memory dies with the DOM.

## Open questions for the spike

1. ~~Expression vs thunk~~ — settled: thunk; typeof gate throws.
2. ~~Brand for rerenderables~~ — settled: unnecessary; the chain rule
   is structural.
3. ~~UIComponent props contract~~ — dissolved: intake is a method
   (`initialize` for instances, constructor for classes).
4. ~~Promise-of-component~~ — cut; async-function recovery idiom.
5. **Channel update internals** — relax privates vs azoth-internal
   privileged access (public immutability preserved either way).
   Defer to the Channel increment.
6. ~~render()/update() return type~~ — settled: `Composable`, match
   the runtime.
7. Spike order: ~~(a) runtime Rerenderer~~ (landed 2037a5f);
   ~~(b) thoth per-site factories~~ (landed ce5afbd, plus the
   latent empty-import fix); ~~(c) compose per-type update dispatch
   with the chain rule + create() narrowing~~ (landed — chain rule
   in composeComponent, walkChain, component memo on the anchor
   entry, create() narrowed to function | class | render-object |
   null/undefined); (d) UIComponent protocol + initialize;
   (e) Channel conformance last. Each its own increment.
