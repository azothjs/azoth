# Frames

> *In Azoth, the page renders forward once. Top to bottom, each slot filled,
> the DOM built — and then that pass is over. Most of what you build lives
> there, in the forward flow.*
>
> *But some structure changes on its own clock: rows arrive and reorder and
> vanish, a detail pane swaps as you click around, a live feed pushes updates.
> I went looking for the component that re-renders when the list changes — the
> state that holds the rows, the effect that re-runs, the diff that works out
> what moved. None of that is here.*
>
> *Instead, the forward flow reaches a boundary — usually a custom element — and
> hands off. Past it, a second render cycle takes over: its own, self-managing,
> outside the page's one-way pass. The question stops being "how do I re-render
> this list" and becomes "where does the page stop flowing forward and hand a
> region its own time?" That hand-off is a* **frame**.

## When do you need a frame?

A frame is a specific tool for a specific shape of problem. The recognition
test is *what changes, and on whose clock*:

- **Static structure** → the forward-only flow. No frame. A `<nav>`, a layout,
  a form's fields.
- **A value that arrives once, or a stream into one slot** → async composition:
  a Promise or `<Channel>` in a `{…}` slot (see
  [Async and Channels](async-and-channels.md)). Still no frame — the slot
  updates, but the structure around it doesn't manage itself.
- **Structure that manages itself over time** — rows appearing, reordering,
  disappearing; a region that swaps what it shows as a key changes → a frame.

Azoth doesn't hand you a general "dynamic UI" engine. There is no reconciler
deciding what changed, because there is no general "what changed" to solve. A
frame is narrower and sharper: a boundary where the page hands a region its own
render cycle, and you drive that region with **deltas** — *this row, in place;
that row, gone* — not with a new snapshot to diff.

## The frame is the seam

The forward-only flow is worth naming, because a frame is defined against it.
When JSX renders, the compiler has already generated the binding functions —
there is no runtime analysis, no diffing pass, no scheduler. The template
clones, the bindings assign, the DOM exists. The flow goes one way and does not
come back.

A frame is the **seam** where that one-way flow hands a region its own render
cycle — a context switch out of the forward pass, with a reset on the way in.
The frame is *the seam itself*, not any one thing that carries it. Two carriers
create one:

- **A custom element** — the canonical carrier. Its lifecycle
  (`connectedCallback`, `disconnectedCallback`) and encapsulation let it own a
  cycle that outlives the forward pass. KeyedList rides this.
- **A component wrapped in `renderer`** — a plain function/object whose render
  is fenced off from the outer pass. No lifecycle; just scope isolation.

This is the sense in which **Azoth makes the platform act like a framework**:
the self-managing component, the lifecycle, the encapsulated render cycle — the
platform already ships all of it, as custom elements. Azoth doesn't reinvent the
component; it hands off to the one the browser already gives you. (The design
notes call the seam *a context-frame change with a reset* — see
[design/frame-primitives.md](../design/frame-primitives.md).)

## Two kinds on the stack: rerenderer and renderer

A frame controls its own cycle through one small mechanism: a stack of *active
renderers*, which `render()` (the per-site factory the compiler emits) and
`compose()` consult. Two kinds ride that stack:

- **`rerenderer`** — re-execution with a per-call-site cache. Wrap a render
  function; call it again and it re-runs and **rebinds in place** — same node,
  new values. Identity is the *call site*, not a key you manage and not a tree
  it diffs.
- **`renderer`** — the **reset**. Pushed to *shadow* an outer rerenderer, so a
  nested scope builds **fresh** instead of being reused. It renders new DOM and,
  by topping the stack, rerenders nothing. Two kinds, two words — there is no
  third.

```js
import { rerenderer, renderer } from '@azothjs/maya/renderer';

const panel = rerenderer((label) => <section><h2>{label}</h2></section>);
const node = panel('Pets');     // builds the <section>
panel('Animals');               // same <section>, <h2> rebound to "Animals"
```

That is the whole rerenderer idea: re-run at the same site, the delta lands. The
`renderer` reset is the other half — a custom element or a component pushes one
to fence its internals off from the page's outer rerenderer. (For the internals
— the per-site cache, `activeRenderer`, `getBound` — see
[design/rerenderer.md](../design/rerenderer.md).) A KeyedList uses **one
rerenderer per row**, which is why a row updates in place.

## A custom element carries a frame — KeyedList

KeyedList is the first frame Azoth ships: a keyed dynamic list as a pure-platform
custom element. You don't use `KeyedList` directly — it is an abstract base
(`extends HTMLElement`, no tag of its own). You extend a **semantic leaf** and
give it two functions.

### Semantic leaves

Three leaves, one per list-shaped element:

| Leaf | Owns | Rows | Tag |
|---|---|---|---|
| `KeyedUList` | `<ul>` | `<li>` | `keyed-ul` |
| `KeyedOList` | `<ol>` | `<li>` | `keyed-ol` |
| `KeyedTable` | `<table><tbody>` | `<tr>` (in the tbody) | `keyed-table` |

Each leaf defines its own tag (idempotently), so `<keyed-ul>` works on its own.
More often you extend a leaf to name your list and bind its row shape:

```jsx
import { KeyedUList } from '@azothjs/maya/lists';

class PetList extends KeyedUList {
    constructor() {
        super();
        this.key  = (p) => p.id;                 // identity (setup, runs once)
        this.view = (p) => <li>{p.name}</li>;    // the row's rerenderable thunk
    }
}
if (!customElements.get('pet-list')) customElements.define('pet-list', PetList);
```

Now `<pet-list>` is yours. Create it, connect it, fill it:

```js
const list = document.createElement('pet-list');
document.body.append(list);                      // connect → builds the <ul>
list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);
// <pet-list><ul><li>Felix<!--1--></li><li>Mittens<!--1--></li></ul></pet-list>
```

(The `<!--1-->` is the interpolation anchor for `{p.name}` — see
[composition](composition.md).)

One platform note: a custom element is summoned by a string tag (`<pet-list>`),
and a string is opaque to the bundler — it cannot see that `<pet-list>` depends
on the module that defines it. So you import that module for its `define` side
effect: `import './pet-list.js'`. This is a property of the platform, not of
Azoth; the pitfalls of custom elements are the pitfalls of the platform.

### `key` and `view`

Two function-valued props, set once in the constructor (the constructor runs
once; the connect/disconnect cycle runs around it):

- **`key(data)` → identity.** How a row is named. `update`, `move`, `remove`,
  `has`, `get` all address rows by this key.
- **`view(data)` → DOM.** The row's rerenderable thunk. KeyedList wraps it in a
  per-row rerenderer, so `update(key, data)` re-executes that row's view in
  place — same node, new values.

That per-row rerenderer is the payoff: an update is a rebind, not a replace.

```js
const before = list.get(1);
list.update(1, { id: 1, name: 'Felicia' });
list.get(1) === before;                          // true — same <li>, rebound
```

### The ops keep the delta

Every op is a delta — the change you name, applied directly. Nothing
reconciles by diff; you tell the list what happened, row by row. All positioning
is **key-relative** (there are no indices):

| Op | Does |
|---|---|
| `add(...items)` | Append each argument as a row |
| `addAll(items)` | Append each row in an iterable |
| `insert(data, beforeKey)` | Place a row before `beforeKey`'s row; `null` → append |
| `update(key, data)` | Re-run that row's view in place — same node, new value |
| `move(key, beforeKey)` | Relocate a row before `beforeKey`'s row; `null` → to the end |
| `remove(key)` | Drop the row, its node, and its key |
| `clear()` | Empty the list and the key map |
| `has(key)` | Is there a row for this key? |
| `get(key)` | The row's node, or `null` |
| `keyFor(node)` | Inverse of `get`: a node (or descendant) → its row key; outside any row → `undefined` |
| `size` | How many rows |
| `[Symbol.iterator]` | Yields `[key, node]` for each row |

`keyFor` is the event-handling companion to `get`: from `event.target`, walk to
the row's key.

```js
list.addEventListener('click', e => {
    const key = list.keyFor(e.target);
    if (key !== undefined) list.remove(key);
});
```

### A frame survives an outer re-render

This is the seam doing its job. Put a list inside a re-rendering region; the
element is reused by site and its rows are left untouched:

```jsx
const panel = rerenderer((label) =>
    <section><h2>{label}</h2><pet-list></pet-list></section>);

const section = panel('Pets');                   // connect → pet-list builds its <ul>
const list = section.querySelector('pet-list');
list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);

panel('Animals');                                // outer re-render
// same <section>, same <pet-list> (reused by site),
// <h2> rebound to "Animals", the two rows still there
```

The outer rerenderer reuses the element by call site and never reaches into it.
The list's imperatively-managed rows survive the outer pass — the frame keeps
its own state. Note that KeyedList gets this *without* pushing a `renderer`
reset: its rows are built in ops (`addAll`, `update`) that run **after** the
forward pass closes, so the outer rerenderer is never active when a row is
built. The reset earns its keep for the other carrier — a component that renders
*during* the pass.

## Driving a frame from a source (controllers)

A frame is driven by ops, so a live data source needs something that turns its
deltas into ops. That something is a **controller** — and Azoth ships none. It is
a recipe you implement (or import from a per-source library): subscribe to the
source, map each delta straight to a list op, and tear down on dispose.

```js
// A source's events → list ops. The delta maps straight to an op; no diff.
class FeedController {
    constructor(source, list) {
        this.#on(source, 'insert', e => list.add(e.detail));
        this.#on(source, 'update', e => list.update(e.detail.id, e.detail));
        this.#on(source, 'remove', e => list.remove(e.detail));
    }
    #offs = [];
    #on(source, type, fn) {
        source.addEventListener(type, fn);
        this.#offs.push(() => source.removeEventListener(type, fn));
    }
    dispose() { this.#offs.forEach(off => off()); }   // pairs to disconnectedCallback
}
```

A Supabase realtime channel, a WebSocket feed, a plain `EventTarget` — same
shape: source delta in, list op out. Because the ops are deltas and the source
emits deltas, the controller is mostly a translation table. Nothing reconciles:
an `insert` event is an `add`; an `update` event is an in-place row rebind. (The
worked example, with teardown, is in
[`keyed-list.test.tsx`](../../packages/valhalla/keyed-list.test.tsx).)

## A component carries a frame too — the `renderer` reset and the UIComponent protocol

A controller drives a frame that already exists. Sometimes the frame itself has
to change — most often, a region keyed to something that *itself* changes. A
detail pane shows pet #1; the user clicks pet #2; now the whole subscription, not
just a row, must be rebuilt against a new key. That is a different join: not "a
delta arrived," but "the thing this frame is about has been replaced."

You don't need a custom element for this. A plain component can carry the frame
— you just fence its render off from the page's outer pass with the `renderer`
reset. **Protecting a component (or custom element) with `renderer` is the
standard way to reset render mode:** inside it, every render builds fresh, and
the outer rerenderer can't reach in to reuse.

The component's *update shape* is the **UIComponent protocol** — not a class you
extend (there is no `UIComponent` to import), but a shape any object, class, or
function can implement, which `compose` drives:

```
initialize?(props, childNodes)            // optional: set up once
render(): DOM                             // first paint
update(props, childNodes): DOM | void     // a prop changed: return new DOM, or void to adapt in place
```

(In the types this is two shapes: `render` + `update` is the base **`UIComponent`**
that `compose` drives in a slot; add the optional `initialize` and it's the
fuller **`Component`** that `create` — `<C/>` — runs end to end.)

These are two different axes, and they compose: **UIComponent is how a thing
updates; a frame is where its render cycle is isolated.** A component driven by
an async source, fenced by `renderer`, owning a cycle on the source's clock — is
a frame. A small imperative tweak inside the forward flow is just a UIComponent,
no frame needed.

`Channel` is the shipped instance of this protocol — update-only (it has no
`render`; it paints initial DOM, then updates from its source). It owns *a zone
of layout responsibility for one source's events*, and its `update` is the
canonical key-change lifecycle:

```js
update(props) {
    if (props?.source === this.#sourceRef) return;   // same source → keep the live subscription
    this.#controller.abort();                        // new source → cancel it (AbortController)
    return new Channel({ ...props });                // → reconstruct on the new source
}
```

Read that as the detail-pane story: the key changes → the region re-renders with
a new `source` → `Channel.update` sees a different source, aborts the old
subscription, and reconstructs against the new key. Same source? A no-op — the
live subscription keeps running. The abort-and-rebuild lives in one place,
expressed as plain platform mechanics (an `AbortController`), not a framework
lifecycle.

So the two axes compose: a **controller** feeds row-level deltas *into* a stable
frame; the **UIComponent protocol** rebuilds the frame's *source* when the key
it is bound to changes. A live, keyed detail view uses both.

## Nothing here is privileged

The strongest evidence that frames are platform-native, not framework magic:
**KeyedList and Channel reach for nothing internal.** KeyedList imports only the
public `rerenderer` and the platform (`HTMLElement`, `document`, `Map`); Channel
is an ordinary object implementing the update shape over an `AbortController`.
Neither touches a compose internal, the renderer stack, or a `siteKey`.

The reverse holds too: `compose` has no privileged branch for `Channel` — it
recognizes the **Input shape** (`{ from, … }`) structurally, exactly as it would
a bare object literal. Channel is one implementer of a shape any author can
write, not a class the core special-cases.

So a frame is a **replicable author pattern**, not a maya capability. Any author
can build a self-managing frame the same way KeyedList does — `extends
HTMLElement` + `Map<key, rerenderer(view)>` + imperative ops + an idempotent
`define` — or fence a component with `renderer`. KeyedList and Channel are worked
*examples* of the pattern; Azoth ships the seam, not your Supabase. (That the
public `rerenderer` + `renderer` are sufficient to build them is the point — the
core stays small, and the frame primitives are an invitation, not a limit. See
[frame-primitives.md](../design/frame-primitives.md).)

## What a frame is not

- **Not a reconciler.** No virtual tree, no diff, no "what changed" computed for
  you. You apply deltas.
- **Not a state layer.** Azoth never makes the UI a function of one — no
  `ui = fn(state)` contract forcing every datum into a single replication store.
  A frame holds whatever local state the problem needs (a closure variable, an
  instance field) — that's just data with a short reach. The subtraction is of
  the artificial replication layer, not of data.
- **Not for static structure.** If it does not change on its own clock, it
  belongs in the forward flow. A frame you never mutate is a custom element you
  did not need.
- **Not the only way to show async data.** A value into a slot is async
  composition, not a frame. Reach for a frame when structure manages *itself*
  over time.

## See also

- [Async and Channels](async-and-channels.md) — values and streams into a slot;
  `<Channel>` in depth
- [Composition](composition.md) — the `{…}` slot and interpolation anchors
- [design/keyed-list.md](../design/keyed-list.md),
  [design/frame-primitives.md](../design/frame-primitives.md) — the design
  reasoning behind the seam
- [design/rerenderer.md](../design/rerenderer.md) — the rerenderer internals
- Worked examples:
  [`packages/valhalla/keyed-list.test.tsx`](../../packages/valhalla/keyed-list.test.tsx)
