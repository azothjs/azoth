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
| function | call → DOM | **re-call** (bread and butter; remember the function; fresh DOM). Stability is recursively opt-in: a function wanting stable DOM returns its own `rerenderer(...)`. |
| UIComponent (class or object literal) | construct / literal — props intake ONCE | `instance.update(newProps)` |
| Channel | construct | open: update method (process TBD) or relax field privacy for an azoth-internal privileged path |
| Node | **removed** — throws (landed 3dafed7). The skinning subtraction, completed: create must actually produce something. |
| web component | intrinsic — tag in template HTML, attrs/props are binds; azoth doesn't intercept | rebind (see attr/prop table TODO: add custom-element validation cases) |

## UIComponent: unify class and render object (subtract to unlock)

Today a class gets props twice — `new input(props, childNodes)` AND
`render(props)` via the render-object path. The unification: props
intake happens once (constructor for classes, literal property for
object literals), `render()` takes no args, `update(newProps)` is the
change channel. Class instances and object literals satisfy ONE
protocol; "render object" stops being a separate dispatch type:

```ts
export interface UIComponent<Props extends object> {
    props: Props;
    render(): Node;
    update(newProps: Props): void | Node;
}
```

`update` returning void = handled internally (the instance keeps its
own refs / rerenderer). Returning a Node = replace prior output.
Open: is `props` a contract compose relies on, or author convention?
And `render(): Node` may widen to DOMChild in the typing review.

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

## Open questions for the spike

1. ~~Expression vs thunk~~ — settled: thunk; typeof gate throws.
2. **Slot-source vs rerender interplay** — largely addressed by the
   === skip; what remains is defining replace semantics when the ref
   DOES change while a source is mid-flight (subscription teardown =
   future cancel semantics).
3. **Channel update semantics** — option 1 (update method + process)
   vs option 2 (relax privates / azoth-internal privileged access,
   keeping public immutability). Workable either way; defer to spike.
4. **UIComponent `props`** — contract or convention (above).
5. Spike order: runtime Rerenderer (getNode + occurrence + prune +
   typeof gate + === skip, test-backed) → thoth per-site factories →
   compose per-type update dispatch (function re-call + UIComponent
   update first). Intrinsic-only proves the core; UIComponent next;
   Channel last.
