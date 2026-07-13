# KeyedList — design dialogue transcript

_A human–AI design collaboration between **Marty** and **Claude**, working out a `KeyedList` web-component primitive for the Azoth framework. Extracted verbatim from the session transcript; assistant reasoning (“thinking”) blocks were encrypted in the source and are not recoverable, so only the spoken replies appear below._

---


## Marty

Keen insights. Let’s keep discussing. I’ll keep
Poking on the shapes I see., so do you. Riffing. Channel and Rerenderer materialized and and sharpened through exactly this type of discussion and collaboration. 

CSS as correct view logic engine. This is a shift not just of preference but of necessity for azoth’s platform focus. The use of ‘data-selected’ directly tracks to “local state” stored in the DOM. State management allowed lazy thinking. Writing the decision to the document. There is no need in state management to be precise. 

We haven’t touched on KeyedLists actual implementation of DOM manipulation. We developed the UIComponent as init, render, update. KeyedList could or must (?) implement that, but it would effect the map or id, but List doesn’t have a source like channel does. It presents an interface to be controlled by some author defined process. Quick mention that we’ve been dancing around the single node required to work with rerenderer, largely because Fragment disgorges its children on append. Isn’t there a proposal for a durable container? Likewise the inclusion of the container parameter was a hack to avoid the anchoring issues. AnchorBlock showed the compose functionality could be reused. But that tracking mechanism doesn’t work well for arbitrary insertion and removal. I have some ideas but let me get your take.


## Claude

Three fat threads here. Let me ground one thing first (the `init/render/update` lifecycle — I want to riff on what's actually there, not a paraphrase) and then give you my takes.

_(searched the codebase for UIComponent / lifecycle init|render|update)_

Lifecycle grounded: the protocol is **intake** (constructor / `initialize(props)`), **`render()`** (no-args first paint), **`update(newProps)`** (change verb). Channel skips `render()` — it has `initial` + a source. That distinction is the hinge for your KeyedList question, so let me start there.

## Riff 1 — KeyedList keeps the delta; that's why it's a controller, not a source

You said it precisely: "List doesn't have a source like channel does. It presents an interface to be controlled by some author defined process." Three intake shapes, not one:

- **Channel** — *push-driven*. The source ticks; update fires internally. The author doesn't call it.
- **UIComponent** — *prop-driven*. The parent re-renders, hands down `newProps`, `update(newProps)` rebinds.
- **KeyedList** — *author-driven*. `add` / `move` / `remove` fire on the author's schedule. Nobody pushes; nobody re-renders it from above.

Now connect that to your state-management riff, because they're the same insight. The keyed reconciler — `update(newRowArray)`, diff by key, figure out what moved — **exists only to recover deltas that state management threw away.** You had "user dragged row 3 to slot 0." State management discards that and hands the framework a fresh array; the framework burns a diff to *reconstruct* the delta it was handed for free. That's the lazy blob, paid for downstream.

KeyedList's verb API **keeps the delta.** `move(key, 0)` *is* the fact, stated precisely, no diff. So:

- **`render()`** — yes, it implements this (mount the container, paint initial rows). This is its compose citizenship.
- **The verbs** (`add`/`update`/`remove`/`move`) — the *primitive* surface. Precise, delta-native, no reconciliation.
- **`update(rows)`** — *optional, derived* reconcile face, implemented **in terms of** the verbs (diff incoming array against the Map, call add/remove/move). Offer it only as a bridge for authors who genuinely have a blob (it came off the wire as a full array). It's the lazy door, built on the precise machine — not the other way around.

So KeyedList "implements the protocol" at `render()`, declines the single `update(newProps)` (its update is plural and externally clocked), and exposes verbs instead. The reconciler is sugar, and naming it as sugar keeps the precision honest — same move as `data-selected` over a state flag.

## Riff 2 — the durable container already exists; it's an element

Here's where I'll push back on your own framing. You called the `container` param "a hack to avoid the anchoring issues." I think the **mechanism was right and only the justification was a hack.**

A list is a contiguous run of siblings. The DOM already has a durable, mutation-stable container for exactly that: **an element** (`<ul>`, `<ol>`, `<tbody>`, `<menu>`). A `DocumentFragment` disgorges its children on insert *because it's the transient counterpart* — it's a transport, not a home. Reaching for a "durable fragment" is reaching for an element with the serial numbers filed off.

Once the list owns a real parent element, arbitrary manipulation is **native and O(1)**, no anchors:

```
insert at i   parent.insertBefore(node, parent.children[i])
move          parent.insertBefore(existingNode, ref)   // relocates in place
remove        node.remove()
```

…and the `Map<key, node>` you already hold *is* the ref table. That's the whole DOM-manipulation story. Anchors (the AnchorBlock single comment) only earn their keep when there's **no dedicated parent** — a wrapperless group sharing a parent with foreign siblings. A single anchor gives you "append/replace relative to one point," which is exactly why it **breaks on arbitrary insert/move**, as you observed. Your own evidence argues against the no-container decision from last session: it steers toward anchors, and anchors can't do the thing a list needs.

Bonus payoff — this also resolves the **single-node-for-the-rerenderer** tension you flagged, at both levels:
- a **row** is a single element → satisfies the rerenderer's unit;
- the **list** returns its **container element** from `render()` → one node to compose, even though it holds N rows inside.

The fragment problem never arises for a list. It's dodged at the row level (single-root rows) and the list level (element wrapper).

So the real question isn't anchors-vs-param — it's **who instantiates the element:**

| | Author provides it (`into: ul`) | List mints it |
|---|---|---|
| Tag semantics (ul/ol/tbody/menu) | author's call ✓ | list must guess or be told |
| ARIA / class / attrs | author owns ✓ | needs a props story |
| JSX ergonomics | `<ul>{list.render()}</ul>`-ish | `<KeyedList/>` self-contained |

My lean: **author owns the element, list owns the ordered children.** Tag and ARIA are semantic and belong to the author; the DOM ops are identical either way. That's a clean ownership split, and it rehabilitates the param as *correct*, not hacky. (A middle option: compose `<ul><KeyedList/></ul>` and have the list capture `parentNode` at mount — pretty in JSX, but only clean when the list owns *all* of the parent's children. Worth weighing.)

## On "isn't there a proposal for a durable container?"

Honestly — for the *wrapperless* group case (not lists), the real options are:
- **`DocumentFragment`** — empties on insert, by spec. Transient by design.
- **live `Range`** — can bound and manipulate a span of nodes between two points. Real, but heavyweight and it mutates as the DOM mutates.
- **DOM Parts / Template Instantiation** (web-components CG) — `ChildNodePart`, a marker-bounded child range that supports replacement. Closest thing to a "durable node-range container" — but a *proposal*, not shipped, and I'd want to verify its current state before leaning on it.

I'm not aware of a shipped "persistent fragment that doesn't empty" — flagging that as my belief, not certainty. But the punchline: **a list doesn't need any of it.** That machinery is for the genuinely-wrapperless multi-root case. Lists have a natural element home; use it.

---

That's my take: KeyedList is an author-driven controller whose verbs keep the delta, mounting via `render()` of an element it manages; the container "param" deserves rehabilitation as the durable parent, not anchors. Now — what are your ideas? I'm especially curious whether you're circling paired start/end markers (anchors-done-right), a durable-fragment abstraction, or the element-ownership line — because I think the element line quietly retires the other two for this component.


## Marty

It doesn’t make sense for List to implement UIComponent. We need a primitive (maybe two). Simplest is a Class that is not UIComponent gets instantiated and manages itself. We’re groping for a container. Is there a new interface built around how the list gets rendered. In either case The author complies through existing html semantics. In state management you use the same mechanism for both “here’s a series of headers or tabs to render” and “here’s a row changing list”. The former runs render once more often than not. Forward only is easy to write and reason about. Often large part overall app . In azoth that falls under using one time map operations during initial render. Lots of easy render functions. KeyedList is not a state management concept. It’s enhanced row ordering, updating, add remove move. Over known and existing platform list semantics.  crystallized into jsx and surround js. Simple controllers bringing between source interfaces and list operations. Probably good target for encapsulation, e.g. supabase list, our protocol over websocket list, redux todo list, over existing distributed data choices. 

There are no general problem solutions in azoth because there are no general problems. That got removed. Subtract to unlock. 

Also see similarities with web components. Especially that possible interface around dom container semantics. But List is above semantics of jsx. The expression of a particular list. Need to explore if that element property


## Claude

Yes — and I'll retract part of my last turn while I'm at it. The durable-fragment / `Range` / DOM-Parts detour was me importing a general problem. "No general problems, subtract to unlock" cuts it cleanly: a list's container isn't a general node-range problem, it's a specific element. I was solving a problem azoth already deleted. Good correction.

Let me riff on the threads you opened.

## The subtraction is static-vs-dynamic, and state management refuses to make it

This is the crux of "same mechanism for both." State management has one hammer — store + reconciler — so **"render these tabs"** and **"this row list is mutating"** both go through diffing machinery. They're not the same problem:

- **"A series of headers / tabs / a render-once list"** — forward-only, no identity tracking, no mutation. In azoth this is just `{items.map(row)}` at initial render. A plain easy render function. As you say — *often a large part of the whole app.* It needs **nothing**. No keys, no controller, no reconciler.
- **"A row-changing list"** — add/remove/move/update over time. The specialty. This is KeyedList.

State management can't tell these apart because it threw away the distinction up front (everything's "state, re-render, diff"). Azoth keeps the distinction by **subtracting the universal reconciler** — and the moment you remove it, the general problem evaporates: 95% of "lists" are a one-time map, and the remaining 5% *keep their delta* (a controller op), so nobody ever needs to reconstruct-by-diff. The reconciler existed only to recover deltas state management discarded. Remove the discarding, remove the reconciler. That's the unlock.

So KeyedList is **not a list-rendering abstraction.** It's the narrow mutating-list specialty. Most lists never become one.

## KeyedList = a source→list-ops controller; the named adapters are the product

"Simple controllers bringing between source interfaces and list operations" — this is the shape, and it's strong. The base `KeyedList` is the **list-ops primitive** (add/remove/move/update over keyed platform rows). The things people actually *use* are thin source adapters encapsulated on top:

```
SupabaseList   — realtime row events → list ops
ProtocolList   — your websocket protocol's deltas → list ops
TodoList       — a redux/store slice → list ops
```

Each is "this specific distributed-data choice, wired to platform list semantics." That's the encapsulation boundary, and it's *per-source*, not general — which is exactly right. There's no "universal list." There's "Supabase's list, expressed." The delta-keeping pays off here: a Supabase `UPDATE` event already says *which row, what changed* — the adapter calls `update(key, data)` directly. No diff. The source's delta maps straight to a list op. That's the whole reason this is clean and a reconciler-based list is not.

## The new interface: it *owns* an element, it doesn't *return* a composable

Here's the interface I think you're groping for. UIComponent's contract is **return a composable; the parent may recompose you.** That's wrong for a list. A list's contract is:

> **composed once for placement, then owns its element's children and mutates them directly.**

`render()` exists only to hand its element to JSX for initial drop-in. After that, compose never touches it again — the list self-manages via ops. It *leaves the recompose protocol* the instant it mounts. That's the web-components parallel you're sensing: a custom element is created, connected, and thereafter **owns its subtree** — nobody re-renders it from above; it mutates itself. Same lifecycle shape, minus the recompose contract.

So the "interface around how the list gets rendered" is an **attach-and-own** interface, not a **render-and-recompose** one. And the container is exactly that: **an element property of the controller.** The list *has* an element it owns.

## The fork you trailed off on — "if that element property"

Web components give two ways to be element-bound, and this is the real choice:

- **IS an element** — `class KeyedList extends HTMLElement` → `<keyed-list>`. Unifies controller + element (very WC). But a `<keyed-list>` *isn't* a `<ul>` — you lose platform list semantics (ARIA, list styling, `<tbody>` table participation). The only fix is customized built-ins (`<ul is="keyed-list">`), and those never shipped in Safari. Fragile, and it fights "the author complies through existing HTML semantics."
- **HAS an element** — plain controller object, `this.element` is a real `<ul>`/`<tbody>` the author authored in JSX and handed over (or the list captured at mount). Controller stays above the markup; the element keeps full platform semantics; ops run native against it.

My call: **HAS.** The author writes the real semantic element in JSX (`<ul role=…>`), the list owns its children. "List is above the semantics of the JSX" — yes, so don't *make* the list an element; let it **point at** one. The element is a property; the controller is the orchestration altitude; the rows are the markup altitude. Three clean layers, no customized-built-in fragility, full HTML semantics preserved.

## On "a primitive, maybe two"

My hypothesis for the two, if it *is* two:

1. **An element-owning region** — the generic "I own this element's children, here are the ordered-mutation ops (insert/move/remove against a parent + a node map)." Source-agnostic, key-agnostic. Pure DOM-ownership.
2. **KeyedList** — keying + the row rerenderer + `map`/`key`, layered on (1).

That split would let the ownership mechanism be reused by non-keyed cases, with KeyedList as the keyed specialization. But it might be one primitive if nothing else ever needs (1) alone — and per "no general problems," I wouldn't extract (1) until a second real consumer shows up. Subtract until something forces the seam.

So: which way on **has-vs-is** matches what you're seeing — and is the second primitive real to you yet, or are you also feeling it as one self-managing class until proven otherwise?


## Marty

Yes! That’s the headline around state managements. Hypermedia is lineage and architecture.  Your framing clearly lays out why static-dynamic matches what actual happens and spells out the thing that’s been in the way the whole time. 

Azoth is JSX for the web platform. Observables and async iter helpers are coming. Azoth fills gaps looking to remove them a missing platform pieces. Its end game has to be to be the progenitor of web standard JSX. Not “react shipped in the browser”, not signals or any state driven paradigm. Not an expanded tagged template syntax. Not an invented syntax (sorry svelte), because JSX earned that.

routes to go I can see:

The has syntax has merit. It fills the gap left by safaris non implementation of is. It gives a reasonable and consistent view of child nodes as default sync content. What does the actual experience look like? An object literal? A component that implements List? But throws otherwise? Introduce attribute as API for intrinsic elements, that’s new surface area. 

Stick with List and have it take two JSX props. Straight jsx “here is my container” works, but where to slot in the jsx seems weak because you have to have a rule like outer element is kept and its children are discarded. 

Take a closer look at web components and ask how azoth and jsx makes that experience better.  `class KeyedList extends HTMLElement → <keyed-list>` doesn’t look like ul or table where it’s placed, but authoring occurs in class MyList extends KeyedList. That’s where root gets created. That’s where li gets created. (Are the acceptable list parents finite? Is it (sketch)  KeyedUnorderedList KeyedOrderedList KeyedTable keyed-ul keyed-li keyed-table?
But that breaks the stronger supabase list encapsulation) Which strengthens the case for creation in KeyedList. You see the container and the children.

And you get shadow dom. And there very well are other list implementations built around web components. 

Remind me about  are the creation and mounting semantics of web components? How does the initial render and update case express itself? Remounting?


## Claude

"Progenitor of web standard JSX" reframes the entire design test. Every choice now asks: **would the platform standardize this?** Not "is it clever," but "is this the shape a web standard would take." Run the three routes through that filter and they sort themselves:

- **Route A (attribute-as-API on intrinsics, `<ul az-list={…}>`)** — you named the cost: new surface area. It's *invented convention on platform elements*. Fails the test — that's the htmx-ish road, not the standards road. Out.
- **Route B (container as a JSX prop, outer-kept/children-discarded)** — the discard rule is pure subtext. No standard would say "pass an element, I'll keep the shell and throw the contents." It reads as a hack because it is one. Out.
- **Route C (custom element)** — this one *is* the platform primitive for "an element that owns its subtree and self-manages." It doesn't fail the test; it's the answer the test is pointing at. **This is the line.**

And it answers your earlier "how do azoth + JSX make web components *better*?" Web component authoring is miserable: manual DOM in `connectedCallback`, template-cloning, `attributeChangedCallback` string-juggling, imperative child wrangling. JSX makes the *inside* of the element declarative — `map` is the row template, the rerenderer is the precise update, the custom element is the platform-native ownership shell. **JSX is the missing authoring layer for custom elements.** That's squarely "JSX for the web platform."

So let me give you the lifecycle precisely, since that's what the design rides on.

## Web component creation & mounting

**Creation — `constructor()`**
Runs when the element is *created*: parser upgrade, `document.createElement`, `new`, or — importantly — at `customElements.define()` time for matching elements *already in the DOM* (**upgrade**). Constraints that shape design: you may **not** touch attributes or children here (the parser may not have set them yet), and you may not add children. You *can* `attachShadow`. Rule of thumb: constructor sets up JS state only; DOM work waits.

**Mounting — `connectedCallback()`**
Fires **every time** the element is inserted into a document. This is the mount hook, and "every time" is the catch — it can fire repeatedly, so initial render is guarded by a `#rendered` flag. This is where you build the subtree (light or shadow).

**Unmount — `disconnectedCallback()`**
Fires on every removal. Cleanup, listener teardown.

**Cross-document — `adoptedCallback()`** (rare; `adoptNode` into another document).

**Update — `attributeChangedCallback(name, old, new)` + `static observedAttributes`**
The declarative change channel — but **string attributes only**. Rich JS data comes through **property setters** you write, which trigger your own re-render. There is no built-in re-render; you wire the update path yourself.

## How initial-render vs update vs remount express

- **Initial render:** in `connectedCallback`, guarded-once, build the subtree.
- **Update:** `attributeChangedCallback` (string config) and property setters (rich data) — both call your own update logic.
- **Remount:** remove-then-reinsert fires `disconnected` → `connected` again, but **the instance survives** — its fields, its `Map`, persist (the JS object isn't destroyed). If you didn't tear down the subtree, it's still there. So remount is *stateful and cheap*, unlike React's destroy-on-unmount. The element and its state travel together as one thing.

This maps onto azoth's triple almost exactly:

| azoth | web component |
|---|---|
| `initialize` / constructor intake | `constructor` (state only, defer DOM) |
| `render()` (no-args first paint) | guarded `connectedCallback` |
| `update(newProps)` | `attributeChangedCallback` + property setters |
| Channel (update, no render) | an element that only reacts to attribute changes |

## The gotcha that decides the row design

**Moving a connected custom element fires `disconnectedCallback` then `connectedCallback`.** A move is spec'd as remove-then-insert. So if your **rows** are custom elements, every `move()` churns lifecycle on them. If the rows are **plain `<li>`/`<tr>`** and only the *list* is the custom element, moves fire nothing — plain elements have no callbacks.

→ **The list is the custom element; the rows are plain.** This also keeps `map`-produced rows as ordinary platform nodes, which is what you want for the CSS-as-view-logic story.

And the modern platform answer to move-churn even for rich nodes: **`parent.moveBefore(node, ref)`** — a state-preserving move that does *not* fire disconnect/connect (preserves iframes, focus, animations, custom-element state). Chrome shipped it; I'd verify Firefox/Safari breadth before relying on it, but it's exactly the primitive a `KeyedList.move()` wants, and reaching for it is on-mission (use the platform's newest piece, don't reinvent reconciliation).

## Two edges in your sketch

**Shadow DOM fights your own CSS pillar.** You listed "and you get shadow DOM" as a pro — but shadow DOM *scopes styles away from the author*. The `[data-selected].status-adopted` view-logic we just enshrined lives in **author CSS**, and shadow DOM would wall the rows off from it (you'd be forced into `::part`/custom-props/slots). A custom element does **not** require a shadow root — render into **light DOM** (`this.append(...)`) and you keep the element + lifecycle + behavior-encapsulation *and* full author-CSS reach. My strong lean: **light DOM.** Shadow is for widgets that want style isolation; an azoth list wants the opposite.

**Own from the semantic root down — it dissolves your `keyed-ul/keyed-table` worry.** Your sketch hit the real wall: `<keyed-list>` can't sit inside `<table>` (the table content model only admits `<tbody>/<tr>`), and a matrix of `KeyedUnorderedList/KeyedTable/...` breaks the clean single-axis Supabase encapsulation. The resolution is the one you reached — **creation in KeyedList** — made precise: the custom element **creates its own semantic root and children.** `<keyed-todos>` renders a real `<ul>` inside it; `MyTable extends KeyedList` renders a full `<table><tbody>` and manages `<tr>`. The wrapper sits wherever block content is legal; the *semantic* parent→child relationship (`ul→li`, `tbody→tr`) is created intact *inside*. That sidesteps the content-model problem **and** the customized-built-in (`is=`) Safari gap **and** keeps encapsulation single-axis: the **source** is the subclass's concern (`class SupabaseList extends KeyedList`), the **element type** is its `render`/template concern. One inheritance line, both axes, no matrix. "You see the container and the children" — exactly.

So the shape I'd commit to: **KeyedList is a light-DOM custom element; authoring is `class MyList extends KeyedList`; it creates its semantic root and plain-element rows; `connectedCallback` is the guarded initial render; ops (`add/move/remove/update`) are imperative methods, not lifecycle; the instance carries its `Map` across remounts for free; reorders use `moveBefore` where available.**

The one thing I'd still poke before settling: is `<keyed-todos>` as a *visible extra wrapper element* in the light-DOM tree acceptable to you, or does even one non-semantic node in the chain bother the structural sense? Because that's the price of the autonomous custom element (vs the unavailable `is=`), and it's the only real cost left on Route C.


## Marty

We've conflated controller and "list as authoring for custom elements" presentation. not KeyedList is a supabaselist, KeyedList has a supabase controller paired with a supabase source. 

rerenderer never interfered with platform javascript semantics. Its "magic" in transpilation is a set of very simple rules about _a construct it owns JSX_ :em-dash: maya earns both her name and power - remains invisible yet controls DOM reality :em-dash: while not impeding on an existing js control flow or referencial integrety. The site base rendereding is exactly what a "DOM Literal" would mean.

Apply this thinking to web components. and the magic here is that what we need to build is a much smaller surface area of what we need to support. we need to build up library of guidance patterns, which are additive and discoverable. but the rules azoth introduces strives it keep doors open, responsibility still rests with the author to adhere web standards (and what azoth has claimed is missing via it's ownership of JSX (and potenital primitives with exclusive access inside maya).

Author could hook up supabase in constructor. supported. ( sketches, name-smithing welcome:) 
use `new SupabaseController(source, list)`

the unlock I'm looking for is:
- author combines source and domain semantics as two sides of same coin. Leans on extends. Live pet Adoption implemented on Supabase is a <pet-adoption-dashboard>, or externalizes <pet-adoption-dashboard source={getRefFromImportedService()}>. 
- author does semantic with slotting <pet-adoption-ul>, <pet-adoption-li>
- author does do <supabase-list source={getRef()}> or <keyed-ul source={getRef()} controller={new SupabaseController()}> 
- author has a way to decide what <pet-adoption-ul><li>felix</li><pet-adoption-ul> means

because that's their API. 
same with shadow dom. it's perfectatly legitimate

what we _build_ is simpler, we don't have to boil the ocean, because are goal is to be the ocean. affordance for LLM high priority, that's where you can shine helping us out. we're hitting actual surface area of code.

make easy cases easy, defaults sensible. allow web component sematics to be used _progressively_. the pitfalls _are those of the platform and the authors use of it_


## Claude

You caught a real conflation in my framing, and fixing it *is* the unlock.

## The unlock: two orthogonal axes, composed — never crossed

I wrote `class SupabaseList extends KeyedList` — which **crosses** presentation with source. That's what created the `keyed-ul / keyed-table × supabase / websocket` matrix anxiety. Your correction dissolves it: **KeyedList *has* a controller; it doesn't *become* one.**

| Axis | What it is | How it attaches | Variants |
|---|---|---|---|
| **Presentation** | the element + keyed list-ops over `map`/`key` | `extends` (it's a custom element) | `KeyedUL`, `KeyedOL`, `KeyedTable` — the tag/semantics |
| **Source** | bridges a data source → list ops | **composition** (`new …Controller(source, list)`) | `SupabaseController`, `ProtocolController`, … |

Two axes, orthogonal. Pet adoption = **KeyedUL** (presentation) + **SupabaseController** (source) + **pet template** (domain). Three independent choices, no matrix — because source was never an inheritance concern. "Two sides of the same coin": the **controller** is the source side, the **element + template** is the domain side, and `extends` vs `source={…}` is just *where the author chooses to fuse them*.

## This is the DOM-Literal principle applied to components

maya owns one construct — JSX, the DOM literal — with simple rules, and never touches the JS around it. Apply that here and the build surface collapses:

- **azoth builds:** the rerenderer (row update), the keyed list-ops primitive, JSX-as-DOM-literal. That's it.
- **the platform provides:** the custom element, lifecycle, shadow/light DOM, CSS, slots.
- **the author provides:** their element (their API), their controller, their templates.

We don't wrap web components in a framework. JSX is just the DOM literal *inside* `connectedCallback`, and the custom element is plain author JS that maya never impedes. "We don't boil the ocean because our goal is to be the ocean" — exactly: own the literal, add the missing primitive, let the platform be the platform.

## All your expressions fall out of the same three parts

```js
// SOURCE AXIS — the controller contract: source in, list ops out. Tiny.
class SupabaseController {
    constructor(source, list) {
        this.sub = source
            .on('INSERT', r => list.add(r.new))
            .on('UPDATE', r => list.update(r.new.id, r.new))   // delta kept, no diff
            .on('DELETE', r => list.remove(r.old.id));
    }
    dispose() { this.sub.unsubscribe(); }   // paired to disconnectedCallback
}
```

```js
// (A) baked — source + domain fused via extends → <pet-adoption-dashboard>
class PetAdoptionDashboard extends KeyedUL {
    map = pet => <li>{pet.name}</li>;
    key = p => p.id;
    connectedCallback() {
        super.connectedCallback();                  // builds <ul>, paints initial rows
        this.controller = new SupabaseController(petsSource, this);
    }
    disconnectedCallback() { this.controller?.dispose(); }
}

// (B) externalized — source handed in → <pet-adoption-dashboard source={getRef()}>
class PetAdoptionDashboard extends KeyedUL {
    set source(ref) { this.controller?.dispose(); this.controller = new SupabaseController(ref, this); }
}

// (C) generic primitive + injected controller
<keyed-ul source={getRef()} controller={SupabaseController} map={petRow} key={p => p.id} />

// (D) reusable source-typed list → <supabase-list source={getRef()} map={…}/>
```

Same parts, four assemblies. **The author's element is the API; azoth supplies the parts, never the assembly.** That's why `<pet-adoption-ul><li>felix</li></pet-adoption-ul>` can mean whatever they decide — slotting, light-DOM rows, shadow projection — *because it's their element*, and maya only owns the JSX literals inside.

## Name-smithing

- `SupabaseController(source, list)` — I'd keep **Controller**; you already reached for it ("simple controllers bringing source interfaces and list operations"), and it reads true: it controls the list from the source. `Sync`/`Binding`/`Feed` all narrow it wrongly (imply one direction or one verb). Controller is the honest noun.
- Presentation: **`KeyedUL` / `KeyedOL` / `KeyedTable`** as thin tag-variants over a shared `KeyedList` core (the ops live in the core; the variant just fixes the root element). The matrix fear is gone now that source is off this axis.
- `dispose()` for teardown — pairs cleanly to `disconnectedCallback`. (Mirrors Channel's `AbortController` story; same shape, author-clocked.)

## Shadow DOM — you're right, retract my "law"

I overstepped. Shadow DOM is legitimate; the author owns that tradeoff. The CSS-reach concern doesn't become a *restriction* — it becomes a **discoverable pattern**:

> *Light DOM* keeps rows reachable by author CSS (the `[data-selected].status-adopted` view-logic). *Shadow DOM* isolates styles — reach rows via `::part` / custom properties / slots. Pick per your API.

That's the correct register: guidance, additive, doors open. The pitfalls are the platform's, not azoth's to forbid.

## LLM affordance — where the small surface pays off hardest

This is the real leverage, and it's a direct consequence of "be the ocean": **a model already knows 90% of this.** Custom elements, lifecycle, DOM, CSS, shadow/slots — all deeply in training. So the docs' job is **not to re-teach the platform** — it's to *mark the deltas*:

1. **Name the owned construct.** "JSX here is a DOM literal — it evaluates to DOM, maya owns it by these few rules, everything around it is plain JS you already know." A model reasons cleanly across that boundary. It's the single most teachable framing you have.
2. **Mark azoth-specific bits inline.** In every example, the platform parts are unannotated (the model knows them); the *only* comments are on the azoth deltas (`map`/`key`, the rerenderer rebind, the controller contract). The comment density itself signals "this is the new surface; the rest is standard."
3. **Pattern library = additive + discoverable.** Each pattern is one file: `name · when-to-use · minimal JSX+JS · snapshot`. Self-contained, learnable in isolation, indexed. This matches your existing discipline (maya tests are LLM examples, snapshot-backed). The four assemblies above are literally four patterns.
4. **The controller contract as a stamped shape.** A model handed "source in, list ops out, `dispose()` to tear down" can write a `WebSocketController` or `RedisController` correctly on the first try — because the contract is three verbs and a teardown, and the source API is something it already knows.

The smaller we keep the owned surface, the more the model's platform fluency carries the rest. Surface area *is* the affordance budget.

---

Concrete next step, since we're at real code: I'd **write the four assemblies as the first guidance patterns** — minimal, snapshot-backed, in the maya examples style — and **lift the shell** to the corrected shape (`KeyedList` core + `KeyedUL`/etc. tag-variants + the `Controller` contract documented, not coded). Want me to start with the pattern files (the discoverable library), the lifted shell (the buildable surface), or sketch the `KeyedList` core's connectedCallback/ops against the platform lifecycle first so the primitive is nailed before the patterns lean on it?


## Marty

immensively valuable material since I suggested we start riffing. 
read the rest of prompt then be prepared to do both a dump of full conversation since that point (including thinking if that works and use subs to keep context window cleaner), and then a second file more intelligent look from where we've arrived focusing on the precision we now have since we started, doesn't need to argue the case the history is there, but does need to unpack and show clear line of site. the other artifacts need for below. commit and push. gold i say! 

onward!

`LLM affordance — where the small surface pays off hardest` those four points are :rockstar:
llm story strong. rolls to eval based skills: did the llm use the pattern given the prompt?

Go for authoring tests in Valhalla for DOM parts. I would do it first, because that's the correct answer from an eval pespective of "what yo u want the author" to be able to write" . Author-first exposes constraints early. But I'm not an LLM.

Show writing the code you want work, use domain like syntax, not clever test accounting tricks. Let MatchInlineSnapshot() first generate do the work of driving for html because that's what JSX is contracted to do. 

Controllers tests can control input of injected sources and lists, accounting tricks fine to simple stub/mock/dummy/whatever little simple js thing works. 

This feels downhill so I want permission structure to encourage moving forward if low friction. There are a few threads so fine to halt one and continue others. 

Make a .md plan for yourself. Feel free to leverage workflow and subagent flows, branch/commit strategies per your discretion

Invitation to surface planning exposed discussion and questions before launching into the work! I could be jumping to soon. it feels like we defined our world but the platform/jsx stance. I'm both opening doors and upping the requirements, so no pressure to depart.


## Claude

This is the right place to pause, and your instinct is exact: **we defined the world, but not the platform/JSX stance** — and the author-first tests can't be written without it, because the first test you write *is* the stance, spelled out. So let me surface rather than launch. Plan artifact first, then the gap and the questions.

_(wrote a private scratch execution plan: keyed-list-plan.md)_

Plan's in scratchpad. Here's what I want your eyes on before I move.

## The one real gap: author-first *is* stance-taking

Your two instincts converge into a single thing. "Author-first exposes constraints early" + "we defined our world but the platform/jsx stance" → **the first author-first test forces the stance.** The moment I write the code I want the author to write, I have to commit to: what's the tag, how do props arrive, who owns the lifecycle. So the first test isn't a test — it's the stance decision, made concrete. That's *why* it's the correct eval-perspective answer, and also why I shouldn't write it casually. We should take the stance with eyes open, then let the snapshot generate the truth underneath it.

So the gate before any author-first code is four questions — two are yours to decide, two I verify in the code:

| | Question | Type | My lean |
|---|---|---|---|
| **Q1** | Tag: `<keyed-ul>` (platform-upgraded custom element) vs `<KeyedUL>` (azoth-instantiated component)? | **your call** | hyphenated/platform — it's the whole "be the ocean / DOM Literal" thesis |
| **Q2** | Does azoth set dynamic props (`map`/`key`/`source`) *before* the element connects? | verify in code | needs to be true, or the element wants lazy-upgrade |
| **Q3** | Can `rerenderer(rowFn)` instantiate per-row imperatively (Map<key, rerenderer(map)>)? | verify — **likely already de-risked** | your recent `rerenderer-per-row keyed` + `module-factory … returned closure is the rerenderable` commits look like exactly this |
| **Q4** | Once defined, does it leave azoth compose entirely (pure platform lifecycle)? | your call, leans obvious | yes — cleanest DOM-Literal outcome |

Q1 is the keystone; everything downstream spells from it. My read of everything you've said points hard at **hyphenated, platform-upgraded, light-DOM by default** — but it's your stance to plant, and it's the thing I won't assume.

## Autonomy structure (so low-friction work just moves)

- **Green** — proceed + commit per increment, no check-in: docs, more patterns once the first is validated, snapshot regen, green-test refactors.
- **Yellow** — proceed but report at the commit boundary: a new pattern introducing a new authoring shape (so you can object after, not before).
- **Red** — halt *that* thread, surface, keep the others moving: a constraint that contradicts the design (Q3 failing), or a stance fork (Q1/Q4).

Threads are parallel; halting one never blocks the rest. Branch `keyed-list` off main, commit per increment, push at checkpoints.

## Sequence

1. **Docs** — dump (via an Explore subagent reading the session `.jsonl`, including thinking, so the raw text never hits my context) + synthesis (ends with these open questions as honest line-of-sight). Commit + push. **Safe, independent — I can run this now.**
2. **Resolve Q1–Q4** — the gate.
3. **First author-first test** = the stance, concrete. Validate.
4. **Fan out** — the four assemblies as patterns + controller tests (mocks fine).

And yes — your eval reframe lands: a pattern's definition-of-done isn't "is it correct," it's **"given a realistic prompt, does the model reach for it?"** That makes the pattern library a set of eval targets, not just docs. I've folded it into the synthesis's affordance section.

---

Where I'd like your steer before launching:

1. **Q1 + Q4** — plant the stance (or tell me to verify-then-recommend and you'll ratify).
2. **Docs now, in parallel?** I read step 1 as Green — want me to kick off the dump + synthesis (commit/push the docs checkpoint) while we settle the stance? Or hold everything until Q1 is planted?
3. **Are you jumping too soon?** My honest read: no — *if* we treat the first author-first test as the stance ceremony rather than as routine test-writing. The world is defined enough that author-first will productively expose the rest. The risk isn't earliness; it's writing the first test on autopilot and letting an accidental stance harden. Naming it removes that risk.

Onward — just point me at the first thread.


## Marty

clarifications: 
- prefer rythm of consistently flusing to docs. 
- code-smiting not just name-smithing :)

Q1 <keyed-ul> for reasons:

you said it yourself, it's the similar interface on init/render/update and <KeyedUL> puts those into conflict. there two sides of the same pattern: js initiated flow, custom-element platform initiated flow. <keyed-ul> is purely platform (Q4). it comes from the template which instantiates on web load to prep the content fragment, right? what is impact of that on load cycle? we'll have to nail this down.

it's a context frame change with a reset. it's like a new render cycle out of the original render flow. remember why we got into this, a complex set a functionality that falls outside of the forward-only case. 
 
Azoth components can return custom-elements. The author doesn't need know implementation details to intgrate at the component compsition level: 

```jsx
<main>
    {/* structural elements */}
    <PetFilter/>
    {/* structural elements */}
    <PetAdoptionDashboard/>
    {/* structural elements */}
    {/* ... */}
</main>
```

```
class PetAdoptionDashboard(...) extends KeyedUl /*or KeyedList with internal, or ...*/
{
    /* authoring story new chapter about doing the dashboard...
}
```

I didn't include source. I've seen both patterns used effectively of module level direct source, and main-level injected. as props. in-module works well for realtime systems because you don't need to notify the realtime does it. you can also expose and use events. or in this case a pushable might be all you need to turn the wheel.

why not <keyed-ul>? 

Depends on pain of custom element registration work and timing. 
need to see template-inclusion consequence - help or hinder.  LLM covers "that's too much ceremony to type" and "what's the right way to do this", but this is structural delivery via platform.


Q2,Q3,and custom element registration and load - these are three spikes (research and/or test cases) to resolve that I recall. 


Let me know if i dropped something


## Claude

Stance received and it's the right one — and your reasoning sharpens a precision we hadn't named yet. Let me reflect it, code-smith it, flush it to the doc (starting the continuous-flush rhythm), then confirm the spikes.

_(wrote the living design doc: docs/design/keyed-list.md)_

Flushed to `docs/design/keyed-list.md` — that's the continuous-doc rhythm started; I'll keep landing decisions there as we go.

## The precision your Q1 reasoning unlocked

You said it as "context frame change with a reset… a new render cycle out of the original render flow" — and that's the thing we hadn't named. **The custom element *is* the frame boundary between the two render modes.** Forward-only render builds the page, hits `<pet-adoption-dashboard>`, and hands off to a second self-managing cycle owned by the platform. That's *why* it had to be a custom element and not an azoth component: the dynamic case lives outside forward-only, so it gets its own frame — it doesn't thread back into the page's render. `<KeyedUL>` would have forced it back through the JS-initiated init/render/update path — the conflict. `<keyed-ul>` keeps it pure platform (Q4).

And the seam reads it off the spelling, no invented syntax:

```jsx
<main>
  <PetFilter/>                {/* Capitalized → azoth component, JS-initiated, forward-only */}
  <pet-adoption-dashboard/>   {/* hyphenated → custom element, platform-initiated, own cycle */}
</main>
```

So your `<PetAdoptionDashboard/>` sketch resolves to **hyphenated** — and the casing is a *feature*: JSX's existing lower/Capitalized convention plus the platform's hyphenation convention give us the two-flows distinction for free. That's the answer to the composition-tag question, and it's a free win.

## Code-smith: source is the author's wheel, wired anywhere

Your "I didn't include source on purpose" is exactly right — it's the orthogonal axis, so it doesn't belong in the element's identity. Sketched all four in the doc; the two poles:

```js
// module-level direct — realtime self-drives; "you don't notify it, it notifies you"
const pets = supabase.channel('pets');
connectedCallback() {
    super.connectedCallback();
    pets.on('postgres_changes',{event:'INSERT'}, ({new:p}) => this.add(p))
        .on('postgres_changes',{event:'UPDATE'}, ({new:p}) => this.update(p.id, p)).subscribe();
}

// pushable — "all you need to turn the wheel"
const [pets$, push] = pushable();
connectedCallback() { super.connectedCallback(); (async () => { for await (const p of pets$) this.add(p); })(); }
```

## The three spikes — and I already know part of spike 3

1. **Prop timing (Q2)** — does azoth set `row`/`key`/`source` *before* connect? Determines whether we need lazy-property-upgrade.
2. **Rerenderer per-row (Q3)** — `rerenderer(rowFn)` instantiated imperatively, one per row, keyed. **Likely already de-risked** by your `rerenderer-per-row keyed` + `module-factory … returned closure is the rerenderable` commits — the spike confirms, doesn't discover.
3. **Registration + load + template-inclusion** — here's the platform baseline so the spike *measures* rather than gropes: a `<template>`'s `.content` is **inert** (separate document), so a `<keyed-ul>` inside it **doesn't upgrade while in the template** — it upgrades on *insertion* into the live doc (or at `define()` if already inserted). So `connectedCallback` fires as the cloned fragment lands in the tree. The open part — and your real question — is the **load-cycle cost**: a heavy `connectedCallback` (subscribe/fetch) fires *during* initial render. The spike confirms azoth's clone/insert path matches the spec and measures that cost.

## Did you drop something? A few small things, parked in the doc:

- **extends vs compose** — `extends KeyedUL` (element IS the list) vs `extends HTMLElement` + composes a `KeyedList` core (element HAS a list). This is your "/*or KeyedList with internal*/" — it's the "one primitive or two" fork. The registration spike informs it; not blocking.
- **`map` → `row`** — lean to rename (reads as the row template; dodges Array.map ambiguity).
- **Autonomy structure** — I took your silence as accepted; say so if not.
- **The dump** — still want the raw transcript captured (via subagent, context-clean) alongside this living doc? The doc is the synthesis; the dump is the history.

## Next

Per the autonomy structure, the spikes are Green-ish (Explore/research), and they're the gate. My plan: run the **three spikes as Explore subagents** (keeps my context clean), each returning a verdict + the minimal evidence, then flush results to the doc. Spike 3 is the one that could surface a Red (load-cycle cost) — I'll halt that thread and surface if so, keep the others moving.

Want me to kick off the three spikes now, and run the transcript-dump subagent in parallel? Or is there more frame to set before I depart?


## Marty

one  concern to call out: we need to check if our custom element thoth dom part generation is using dynamic jsx as  js prop. i think static is set attribtute.


Is the custom-element frame also a rerenderer reset? I don't know we can strictly enforce (maybe) but can support. We already documented the potential need for reseting rerenderer flow control, let's call it a `renderer` function for different Class that put's itself on the stack in packages/maya/renderer/renderer.js:

```js

export function activeRerenderer() {
    return stack.length ? stack[stack.length - 1] : null;
}
```

function rename more like activeRenderer which can be a regular renderer (new dom) or a rerenderer (reuses dom). is there need for third word here?

and in renderer.js `const rr = activeRenderer()` can then be tested or otherwise casue the right skip:

```js
if(rr && create) {
    ({ node: root, bind } = rr.getBound(siteKey, buildFresh));
}
else {
    ([root, bind] = getBound());
}
```

in general i think it helps to support authoring  works in constructor based because thunk syntax (either just using functions or forced into by renderer((props) => {}) is defining functions to run jsx, but not actually creating instantiating but logically feels like constructor right place to define. connected/disconnect cylces through. constructor safe place for one time stuff.

If there are a finite set of meaningful html list elements the direction I'm facing towards extending KeyedTAG. They are simple derivations over KeyedList, which itself is exposed for doing "author initiated, potential not semantic html stuff or gaps or exploring the platform"

row is table. item is list. both nouns it's a function. template as verb? (loaded!). map gets more love in async iter helpers (included right?). anything more verby?

Autonomy structure G,Y,R is great. 

go ahead and keep the dump up to date if that works, keeping your context as clean as possible. I'm finding the collaboration is smooth, I wonder if it might be beneficial for people to see what the pace looked like between us that actually makes forward strives, innovating, medium n(still a process of learning!) looks like. or people who struggle to imagine llm as more than search engine or tool.


## Claude

This turn is real implementation territory, so let me ground it in the actual code rather than reason in the abstract. Reading `renderer.js` for the stack/`activeRerenderer` machinery you quoted, and sending two agents out in parallel — one to settle the thoth concern (which is the sharp one), one to keep the dump current without loading it into my context.

_(read packages/maya/renderer/renderer.js)_

