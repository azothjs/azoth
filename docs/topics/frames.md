# Frames

In Azoth, the page renders forward once: top to bottom, each slot filled, the
DOM built — then the pass is over. Most of what you build lives there, in the
forward flow, with async values wired into slots.

But some structure changes on its own clock: rows arrive and reorder and
vanish, a chat thread grows as a conversation runs, a live feed pushes
updates. There is no component that "re-renders when the list changes" — no
state holding the rows, no effect re-running, no diff working out what moved.
Instead, the forward flow reaches a boundary and hands off. Past it, the
region runs its own cycle. That hand-off is a **frame**.

## Why the concept exists

Every framework answers one architecture question for you: *when this
changes, who updates it?* React's answer is uniform — everything is a
re-render. Azoth subtracted that engine, so the question comes back to the
author — and it has two answers, not one: **wiring** (the page connects a
source to a slot) or **a frame** (the region updates itself). Frames exist
to make that split nameable, decidable, and testable.

Without the name, "the list changed" pulls toward two failure modes:

- **Reconciler-seeking** — trying to re-render the whole region per delta,
  hunting for the keys/diff/effect machinery that isn't there. (If you're an
  LLM, this is the corpus pull. The frame concept is the redirect: don't ask
  "how do I re-render this?" — ask "who owns this region's intake?")
- **Boundary-less mutation** — imperative DOM edits scattered across the
  page with no owner, no teardown pairing, no answer to "what survives an
  outer re-render?"

A frame is the discipline between those: structural change stays imperative
and delta-shaped (no reconciler), but it lives behind a surface with an
owner — which is what makes encapsulation, subscription teardown, and
surviving the outer flow's passes all fall out for free.

## The definition — two conditions

A frame is a region that satisfies both:

1. **Its own intake** (the clock). The region's interior changes only through
   intake the region itself defines — its methods and ops, listeners it
   attaches, subscriptions it opens. The outer flow keeps exactly three
   channels into any region it places: the **slot value** (place, replace,
   remove it), **props** (re-subject it — see below), and **children**. If
   those are the only ways in, and interior change flows through the region's
   own surface, the region is on its own clock.
2. **Structural self-management over time** (the work). Rows appearing,
   reordering, disappearing; messages accumulating. A region that only writes
   *values* onto existing nodes — set a `textContent`, toggle a class — is
   tactical DOM work: a widget, a [UIComponent](#re-subjecting-a-region), not
   a frame. (This boundary is deliberate — see
   [design/frame-primitives.md](../design/frame-primitives.md).)

The falsifiable test for condition 1:

> **Can anything outside change this region's interior without going through
> the region's own surface?** If yes — it's wiring on the outer clock. If no —
> the region owns its clock.

## The same UI, both ways — where the intake lives

Condition 1 isolated: a growing message log, built twice. The structural
change is identical; only the location of the intake differs.

**Wiring** — the page assembles the intake; the region is passive:

```jsx
// The page owns the pushable and the slot wiring. The region is just
// a slot the page feeds. Outer clock — not a frame.
const [messages$, push] = pushable();

const log = <ul>{{ from: messages$, append: true }}</ul>;

socket.addEventListener('message', e => push(<li>{e.data}</li>));
```

**Frame** — the region defines the intake; the page can only place it and
call its surface:

```jsx
// The region owns the contract. Any page (or none) drives it the same
// way. Its clock — a frame.
class MessageLog {
    #list = <ul/>;
    render() { return this.#list; }
    add(text) { this.#list.append(<li>{text}</li>); }
}

const log = new MessageLog();
socket.addEventListener('message', e => log.add(e.data));
```

Both grow a list. In the first, replacing the page's wiring changes how the
region updates — the intake belongs to the page. In the second, the update
contract (`add`) survives any page. **A frame is defined by who owns the
intake, not who owns the data** — and not by which mechanism it uses inside.

Three flavors of owned intake, by how far the region reaches:

- **Surface-driven** — exposed methods/ops; callers invoke them.
  `MessageLog.add`, KeyedList's `add`/`update`/`move`/`remove`.
- **Self-driving** — the region attaches its own listeners.
  `AnalysisChat` below; KeyedList's `keyFor` click pattern.
- **Source-driven** — the region (or a controller) owns a subscription and
  translates its deltas to ops. See [controllers](#driving-a-frame-from-a-source-controllers).

## Three axes, one of which is the frame

Untangling what often gets blended — these are independent choices:

| Axis | Choices | Decides |
|---|---|---|
| **Mechanism** | swap (compose replaces at an anchor) · rebind (rerenderer replays) · mutate (imperative ops) | what a change does to DOM |
| **Clock** | outer wiring (slots, props, rerender calls) · the region's own intake | who initiates change — **frames live here** |
| **Packaging** | inline JSX · function · class / UIComponent · custom element | how the region presents to the rest of the app |

A frame may use any mechanism inside (KeyedList mutates rows into place *and*
rebinds each row with a per-row rerenderer). And a frame may be packaged as
anything with the reach it needs — packaging is preference and context, not
what makes it a frame.

Corollaries worth stating, because each is a common tangle:

- **A rerendered region is not a frame.** `as={rerenderer(view)}` on a
  Channel rebinds the same DOM per event — but the page wired that source to
  that slot. Outer clock. Efficient wiring is still wiring.
- **Owning the data doesn't make a frame.** A `DetailView` that fetches its
  own record but is re-invoked by the page's wiring per selection is still on
  the page's clock. It becomes a frame when the page stops re-invoking it and
  the region exposes intake instead (`detail.show(id)`).
- **A component wrapped in `renderer` is not a frame.** That's [the
  shield](#the-shield--the-renderer-reset) — cache isolation, not a clock.

## A class carries a frame — AnalysisChat

From production (pre-KeyedList — the pattern predates the shipped frame): an
AI chat panel. The page places it; from then on, the conversation is its own.

```jsx
class AnalysisChat {
    constructor({ chatId, summary }) {
        this.chatId = chatId;
        this.thread = <div class="chat-thread"><p>{summary}</p></div>;
        this.input = <input onkeydown={e => {
            if(e.key === 'Enter') this.ask();
        }}/>;
        this.el = <div class="chat">{this.thread}{this.input}</div>;
    }

    render() { return this.el; }

    async ask() {
        const question = this.input.value;
        this.input.value = '';
        this.thread.append(<p class="user">{question}</p>);
        const answer = await followUp(this.chatId, question);
        this.thread.append(<p class="ai">{answer}</p>);
    }
}
```

Check it against the definition: the page's channels stop at construction
(props in, root element out). Every interior change — messages accumulating —
flows through intake the class defines (`ask`, driven by its own input's
listener). Structural, over time, on its own clock: a frame, packaged as a
plain class. *"Here's my element; I'll take things from here."*

No base class, no lifecycle registration, no framework hook made this a
frame. It's an authority arrangement, expressed in ordinary JavaScript.

## A custom element carries a frame — KeyedList

KeyedList is the first frame Azoth ships: a keyed dynamic list as a
pure-platform custom element. You don't use `KeyedList` directly — it's an
abstract base (`extends HTMLElement`, no tag of its own). You extend a
**semantic leaf** and give it two functions.

| Leaf | Owns | Rows | Tag |
|---|---|---|---|
| `KeyedUList` | `<ul>` | `<li>` | `keyed-ul` |
| `KeyedOList` | `<ol>` | `<li>` | `keyed-ol` |
| `KeyedTable` | `<table><tbody>` | `<tr>` (in the tbody) | `keyed-table` |

```jsx
import { KeyedUList } from '@azothjs/maya/lists';

class PetList extends KeyedUList {
    constructor() {
        super();
        this.key  = (p) => p.id;                 // identity (setup, runs once)
        this.view = (p) => <li>{p.name}</li>;    // the row's rerenderable thunk
    }
}
if(!customElements.get('pet-list')) customElements.define('pet-list', PetList);
```

Now `<pet-list>` is yours. Create it, connect it, drive it through its ops:

```js
const list = document.createElement('pet-list');
document.body.append(list);                      // connect → builds the <ul>
list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);
```

**`key` and `view`**: `key(data)` names a row — `update`, `move`, `remove`,
`has`, `get` all address rows by it. `view(data)` is the row's rerenderable
thunk; KeyedList wraps it in a **per-row rerenderer**, so `update(key, data)`
re-executes that row's view in place — same node, new values:

```js
const before = list.get(1);
list.update(1, { id: 1, name: 'Felicia' });
list.get(1) === before;                          // true — same <li>, rebound
```

**The ops keep the delta.** You tell the list what happened; nothing
reconciles by diff. All positioning is key-relative (no indices):

| Op | Does |
|---|---|
| `add(...items)` / `addAll(items)` | Append rows |
| `insert(data, beforeKey)` | Place before `beforeKey`'s row; `null` → append |
| `update(key, data)` | Re-run that row's view in place |
| `move(key, beforeKey)` | Relocate; `null` → to the end |
| `remove(key)` / `clear()` | Drop row(s), node(s), key(s) |
| `has(key)` / `get(key)` / `size` / `[Symbol.iterator]` | Read access |
| `keyFor(node)` | Inverse of `get`: a node (or descendant) → its row key |

`keyFor` is the event-handling companion — the self-driving flavor:

```js
list.addEventListener('click', e => {
    const key = list.keyFor(e.target);
    if(key !== undefined) list.remove(key);
});
```

One platform note: a custom element is summoned by a string tag, and a string
is opaque to the bundler — import the defining module for its side effect
(`import './pet-list.js'`). A property of the platform, not of Azoth.

**A frame survives an outer re-render.** Put a list inside a re-rendering
region; the element is reused by site, and its rows are untouched:

```jsx
const panel = rerenderer((label) =>
    <section><h2>{label}</h2><pet-list></pet-list></section>);

const section = panel('Pets');                   // connect → pet-list builds its <ul>
section.querySelector('pet-list').addAll([{ id: 1, name: 'Felix' }]);

panel('Animals');                                // outer re-render
// same <section>, same <pet-list>, <h2> rebound, the row still there
```

The outer rerenderer reuses the element by call site and never reaches inside.
(Pinned: [`keyed-list.test.tsx`](../../packages/valhalla/keyed-list.test.tsx).)

## Driving a frame from a source (controllers)

A frame is driven through its intake, so a live data source needs something
that turns source deltas into ops. That's a **controller** — and Azoth ships
none. It's a recipe: subscribe, map each delta straight to an op, tear down on
dispose.

```js
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

A Supabase realtime channel, a WebSocket feed, a plain EventTarget — same
shape: source delta in, list op out. Because the source emits deltas and the
ops are deltas, the controller is a translation table. (Worked example with
teardown: [`keyed-list.test.tsx`](../../packages/valhalla/keyed-list.test.tsx).)

**Where the intake pipeline lives is a dial**, not a rule — all of these are
the same frame with different reach:

- **Exposed** — the page constructs source + controller and wires them to the
  list's ops. Most testable; most assembly.
- **Injected** — the element accepts a source (or just a URL) and builds its
  controller internally in `connectedCallback`, disposing on disconnect.
- **Sealed** — the element owns everything: fetch, subscription, controller,
  ops. Most self-contained; hardest to test without the real source.

The trade is ordinary dependency-injection judgment. (Production versions of
`createAnalysis` inject the service precisely so tests can mock it.)

## Re-subjecting a region — the update protocol

Orthogonal to frames: sometimes *the thing a region is about* gets replaced.
A detail pane showed pet #1; now it should show pet #2. Not a delta arriving —
a new subject.

Props are the outer flow's channel for exactly this. Under a rerenderer, a
component at the same site receives `update(props, childNodes)` instead of
being reconstructed — the **UIComponent protocol**, a shape (not a base
class) that any object, class, or function result can implement:

```
initialize?(props, childNodes)         // optional one-time intake (create's full form)
render(): DOM                          // first paint
update(props, childNodes): DOM | void  // new subject: return replacement DOM, or void = adapted in place
```

`Channel` is the shipped instance — update-only, and its `update` is the
canonical re-subject move:

```js
update(props) {
    if(props?.source === this.#sourceRef) return;   // same source → keep the live subscription
    this.#controller.abort();                        // new source → cancel internally
    return new Channel({ ...props });                // reconstruct on the new subject
}
```

Same source: no-op, the subscription keeps flowing. New source: abort and
rebuild — resource lifecycle expressed as an `AbortController`, not a
framework hook.

The protocol serves wiring and frames alike: a wired region uses `update` to
swap sources (Channel); a *frame* can accept a new subject through the same
channel and rebuild its interior against it. Implementing `update` does not
make something a frame — it makes it re-subjectable.

## The shield — the `renderer` reset

One mechanism note, last because it's narrow. Template factories consult the
*active renderer* — during an outer rerenderer pass, factory calls are served
from that pass's per-site cache. If a frame's interior mints template DOM
**while an outer pass is live** (a build or `update` running synchronously
inside someone else's tick), those mints would hit the outer cache. `renderer`
is the reset: it shadows the outer pass so a nested scope builds fresh.

```js
import { renderer } from '@azothjs/maya/renderer';
const buildFresh = renderer(() => <li>…</li>);   // fenced: never served from an outer cache
```

Most frames never need it. KeyedList doesn't: its ops run *after* the forward
pass closes, so no outer pass is ever active when a row is built. The shield
earns its keep only when own-clock work overlaps someone else's tick. It
confers cache isolation — not a clock. Wrapping a component in `renderer`
does not create a frame.

## Packaging heuristics

Any packaging can carry a frame. Reach for heavier packaging when its
specific powers apply:

- **Plain class / closure** — the default. AnalysisChat needs nothing more:
  no external listeners to tear down, no markup presence required.
- **Custom element** — when you want lifecycle (`connectedCallback` /
  `disconnectedCallback` for subscription setup/teardown), a tag that appears
  in markup and templates, or a hard reuse boundary. KeyedList wants all
  three.
- **UIComponent protocol** (add `update`) — when the region must accept a new
  subject under an outer rerenderer without being rebuilt.

Azoth's preference for the platform is a default, not a mandate.

## Nothing here is privileged

The strongest evidence that frames are platform-native, not framework magic:
**KeyedList and Channel reach for nothing internal.** KeyedList imports only
the public `rerenderer` and the platform (`HTMLElement`, `document`, `Map`);
Channel is an ordinary object implementing the update shape over an
`AbortController`. Neither touches a compose internal, the renderer stack, or
a `siteKey`.

The reverse holds too: `compose` has no privileged branch for `Channel` — it
recognizes the **Input shape** (`{ from, … }`) structurally, exactly as it
would a bare object literal.

So a frame is a **replicable author pattern**, not a maya capability: `extends
HTMLElement` + `Map<key, rerenderer(view)>` + imperative ops + idempotent
`define` — or a plain class with methods, like AnalysisChat. KeyedList and
Channel are worked examples, not special cases. Azoth ships the seam, not
your Supabase. (Which patterns earn shipping vs stay recipes:
[frame-primitives.md](../design/frame-primitives.md).)

## What a frame is not

- **Not a reconciler.** No virtual tree, no diff, no "what changed" computed
  for you. You apply deltas.
- **Not a state layer.** A frame holds whatever local state the problem needs
  (a closure variable, an instance field) — data with a short reach. The
  subtraction is the replication layer, not data.
- **Not a rerendered region.** `rerenderer` rebinding a wired slot is
  efficient wiring — outer clock.
- **Not anything wrapped in `renderer`.** The shield is cache isolation, not
  a clock.
- **Not for static structure.** If it doesn't change on its own clock, it
  belongs in the forward flow. A frame you never mutate is a custom element
  you didn't need — *as a frame*. (Slots, shadow DOM, and style
  encapsulation are their own, perfectly good reasons to reach for a custom
  element.)
- **Not the only way to show async data.** A value into a slot is async
  composition. Reach for a frame when structure manages *itself* over time.

## See also

- [`keyed-list.test.tsx`](../../packages/valhalla/keyed-list.test.tsx) — the
  ops, the controller recipe, frames under an outer rerenderer, all pinned
- [`channels.test.tsx`](../../packages/valhalla/channels.test.tsx) — wiring:
  values and streams into slots
- [design/frame-primitives.md](../design/frame-primitives.md) — which frames
  ship vs stay recipes; the routing stance
- [design/keyed-list.md](../design/keyed-list.md),
  [design/rerenderer.md](../design/rerenderer.md) — design records
