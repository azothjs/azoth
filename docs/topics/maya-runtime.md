# Maya Runtime

> Maya is Azoth's runtime — the small set of services that actualize Thoth's
> compiled templates into DOM in the browser. The reframe that took me a
> while to find: **Maya has React-shaped concepts available, but you opt
> *into* them, not *out of* them.** The base case is direct DOM. As your
> needs grow, you reach for layers — compose, blocks, the renderer. Each is
> an opt-in.
>
> I came in expecting an always-on machine: a render cycle that runs, a
> reconciler that diffs, a state system you wire your data into. None of
> that is the base case here. The base case is a real DOM tree returned
> from JSX. The layers are tools you pick up when a specific need arises —
> not scaffolding you start inside of.
>
> Once that landed, the runtime got small. There are four things to know,
> and you only need the one that matches what you're doing.

## The four layers

Maya provides opt-in levels of sophistication. You combine these as needed.

| Layer        | Purpose                                                        | Complexity |
| ------------ | -------------------------------------------------------------- | ---------- |
| **compose**  | Value integration, initial render, streaming                   | Simplest   |
| **replace**  | Swap content at an anchor                                      | Simple     |
| **blocks**   | Replicated templates, list operations (add/remove/update rows) | Medium     |
| **renderer** | Cache DOM, replay bindings, "UI = f(state)" for a section      | Advanced   |

You pick the layer that fits the piece of functionality. Most code never
leaves `compose`. The other layers are there when a specific shape of
problem calls for them.

## compose — the resolution chain

`compose` is the runtime that fills a `{…}` slot. It takes any value and
dispatches it into DOM through a defined order of tests — a string becomes
a text node, a `Node` is appended, a `Promise` resolves and the resolved
value re-enters the chain, an async generator's yields replace, a
`ReadableStream`'s chunks accumulate.

The full table and worked examples live in [composition](composition.md).
What's worth holding in mind here:

- `compose` is recursive. When a Promise resolves to a Node, the Node
  branch handles it. When a function returns a function, it's called
  again. The chain runs until something matches a terminal branch.
- `compose` works against an **anchor** — a comment node (`<!--0-->`) that
  marks the slot's position. New content goes before the anchor; the
  anchor stays put for the next composition.
- A sibling function, `create`, is the same chain but aware of `props` and
  `childNodes`. It's what Maya uses when a component is the value being
  composed.

The supporting helpers exported alongside `compose`:

- `replace(anchor, value)` — clear the slot and insert new content.
- `clear(anchor)` — remove the previously inserted nodes.
- `composeComponent` / `createComponent` — the component-aware entry
  points used by the compiler.

You rarely call these directly; the compiled code does. They're listed
here because they show up in stack traces and in test files.

## Channel — render now, deliver later

A common shape: you want something on screen *immediately*, and you want
the async value to take its place when it arrives. That's the Channel
pattern.

```jsx
import { Channel } from '@azothjs/maya/compose';

<div>
    {Channel.from(
        <p>Loading…</p>,
        fetchData().then(data => <Results data={data} />),
    )}
</div>
```

`new Channel({ source, as }, childNodes)` returns an instance that
`compose` knows how to unpack: `childNodes` (the JSX children, or the
second constructor arg) composes synchronously as the initial render,
the `source` drives subsequent updates at the same slot. `as` optionally
transforms each value the source produces.

Most authors don't construct `Channel` directly. The JSX form is the
usual surface:

    <Channel source={fetchResults()} as={SearchResults}>
        <p>Loading…</p>
    </Channel>

That JSX invocation IS the constructor call — the class is the
component. See [async-and-channels](async-and-channels.md) for the full
surface (`source`, `as`, `map`, children).

## blocks — list management

When you need add/remove/update on a list of nodes, you reach for blocks
instead of doing it by hand. The `blocks/` module provides several
strategies for the same underlying need:

- **Anchored blocks** — a positional anchor that exposes `replace`,
  `append`, and `remove`. Useful when items don't need identity, just a
  stable spot.
- **Keyed blocks** — each rendered row carries a `data-az-key`. Operations
  like `getById`, `updateById`, `selectById` target rows by key. Useful
  when rows have identity and you want O(1) lookup.

The point isn't the specific API — it's that list mutation is an opt-in.
You don't get a generic reconciler that diffs arrays for you. You pick the
strategy that fits the list, and the operations you need become
first-class on that strategy. Deep mechanics live in the package source;
this is the overview.

## renderer — cached DOM + replay bindings

The renderer is the opt-in for "UI = f(state)" applied to a **section** of
DOM. It works by keeping the DOM the first render produced, then re-running
the **same binding functions** with new values. There is no reconciliation;
the bindings are deterministic because the DOM structure is stable.

The typical entry points are `Controller` and `Updater`, wrappers around a
render function:

```javascript
const updater = Updater.for(name => renderDOM(name));

const node = updater.render('felix');     // creates <p>felix</p>
updater.update('duchess');                // same <p>, now shows "duchess"
```

What happens on `update`:

1. The existing node is pushed onto an internal injectable stack.
2. The render function runs again.
3. The runtime finds the cached `bind` function for that node (kept in a
   `WeakMap` keyed by the root).
4. The same `bind` is called with the new values; bindings replay against
   the same DOM nodes.

`Controller` is the general form (`update(node, props)`); `Updater`
extends it for the single-node case (`update(props)` — node reference
held internally).

This is the right tool for sections with stable structure and data
updates: a status panel whose layout never changes but whose values do,
counters and gauges, a card that re-binds when fresh data arrives. It is
**not** the right tool for sections that need to recompose their layout —
swap one component for another, change the shape of the tree, branch on
data. For that, the slot itself and the compose chain are the answer (via
a channel or a promise in the slot).

See [async-and-channels](async-and-channels.md) for the Controller/Updater
discussion in context, and the renderer test files in
`packages/maya/renderer/` for worked examples.

## Inverse of React, briefly

React requires **hook-call ordering** for state stability — the same hooks
must run in the same order on every render so React can match them up.
Azoth's renderer requires **DOM-structure stability** for replay binding —
the same DOM must exist between renders so the bindings can re-run against
it.

Different constraints for different mental models. Don't dwell on the
parallel; the trade is just worth naming once.

## What this is *not*

A subtraction, not a contrast. Things that simply do not exist in Maya:

- No reconciler. The runtime doesn't diff trees against each other.
- No render cycle that the runtime drives. Composition happens once per
  value arriving at a slot.
- No global state machine. Each section picks the layer it needs.
- No "key" prop on lists. Identity, when needed, lives in blocks.

These weren't replaced. They were never introduced.

## Foot-gun

**The renderer is not a general state management solution.** It's for
sections of DOM with predictable updates against a stable structure. If
you find yourself wanting the renderer to handle "what if the layout
changes here" — that's a sign the section should be driven by a channel
(recompose) instead of the renderer (re-bind).

Recompose vs re-bind is the call:

- **Recompose** (layout changes): channel into the slot. The compose
  chain handles it; new DOM replaces old.
- **Re-bind** (values change, layout stable): renderer + `Updater`. Same
  DOM, new values through the cached bind function.

When in doubt, start with a channel. Reach for the renderer when DOM
preservation matters (scroll, focus, animation state) or when the same
section updates frequently enough that DOM creation cost matters.

## See also

- [Composition](composition.md) — the full compose resolution chain
- [Async and channels](async-and-channels.md) — `Channel` in context,
  `channel()` as the canonical helper, Controller/Updater
- [Components](components.md) — function and class forms; what compose
  passes to a component
- [JSX as DOM](jsx-as-dom.md) — why a value composed into a slot is the
  actual DOM
- [Thoth compiler](thoth-compiler.md) — the pipeline that produces the
  templates Maya clones
- [For LLMs](for-llms.md) — terminology discipline when describing the
  runtime
