# Composition

> The braces in JSX — `{…}` — are a **general composition target.** Whatever
> you put there, Azoth resolves into DOM through a defined evaluation chain.
> Not just for text. Not just for components. Any value.
>
> I first read `{value}` as string interpolation with extras. That framing
> hides what's actually happening: the slot is a typed dispatch point. A
> string becomes a text node. A `Node` is appended. A `Promise` resolves and
> the resolved value goes through the same chain. An async generator yields
> deltas. The slot has one job — turn this value, whatever it is, into DOM at
> this position — and it does it the same way every time.
>
> Once that landed, the things that had felt like separate features
> (interpolating a value, awaiting a promise, streaming from a generator,
> nesting a component) collapsed into one mechanic with a known order of
> tests.

## Interpolation contexts

JSX braces appear in three positions. Each has a defined meaning.

**Child interpolation** — accepts any value, dispatched through the compose
chain:

```jsx
<div>{value}</div>
<p>Hello, {name}!</p>
```

**Attribute interpolation** — dynamic property assignment on the element:

```jsx
<input value={current} disabled={isDisabled} />
<div className={cls} data-id={id} />
```

The value is passed through as a DOM property. See
[attributes-and-properties](attributes-and-properties.md) for the static-vs-
dynamic, attribute-vs-property rules.

**Component interpolation** — invokes the component:

```jsx
<Greeting name="world" />
<Card title="Welcome">{body}</Card>
```

The rest of this page is about the first form — child interpolation — which
is where the compose chain runs.

## The compose resolution chain

Maya's `compose` function is the runtime that fills a `{…}` slot. It
evaluates the value through these tests, in this order. The first match
wins:

| Test     | Target                                     | Action                                |
| -------- | ------------------------------------------ | ------------------------------------- |
| value    | `undefined`, `null`, `true`, `false`, `''` | ignore / remove                       |
| type     | `string` or `number`                       | append as text                        |
| instance | `Node`                                     | append                                |
| type     | `function`                                 | call, compose the result              |
| instance | `Promise`                                  | `.then()`, compose the resolved value |
| value    | `Array.isArray`                            | map, compose each element             |
| type     | `object`                                   | check for async protocols:            |
| has      | `[Symbol.asyncIterator]`                   | iterate, compose each yield (covers `ReadableStream`) |
| has      | `.subscribe`                               | observe, compose each emission        |
| (none)   |                                            | throw                                 |

The chain is recursive. When a `Promise` resolves to an array of nodes, the
array branch handles them. When a generator yields a `Node`, the `Node`
branch appends it. When a function returns another function, it's called
again. The slot does one thing: turn this value into DOM at this position.

## Replace vs accumulate

Default behavior is **replace**, for every source. When new content arrives
at a slot — a promise resolving, a generator yielding, a stream chunk, an
observable emitting — it replaces what was there.

Accumulation is opt-in, declared upstream of the slot: the `append` prop on
`<Channel>`, or `append: true` on an Input literal (`{ from, append: true }`).
The first source value replaces the initial render; subsequent values
accumulate.

## The anchor mechanism

At compile time, every child interpolation site becomes a comment node
(`<!--0-->`). At runtime, that comment is the **anchor**: a stable position
in the DOM that survives content changes.

When a new value composes at the slot:

1. `clear(anchor)` removes the previously inserted nodes.
2. The new content is inserted **before** the anchor.
3. The anchor stays in place for the next composition.

Anchors are positional, not semantic. They don't carry identity; they mark
"the spot." This is what lets the same compose chain handle a one-shot
string, a streaming generator, and a swap from a promise — they all
operate on the same anchor.

## Composition vs interpolation

Two related ideas, often used loosely. The doc keeps them distinct:

- **Composition** is the recursive building of DOM trees — nesting elements
  and components, passing DOM into slots, assembling pieces into larger
  pieces. This is what developers do.
- **Interpolation** is what Maya does inside a `{…}` slot at runtime —
  dispatching the value through the compose chain into DOM.

Composition is the architectural pattern; interpolation is the runtime
mechanic that makes it work.

## Examples through the chain

A DOM node passes through directly:

```jsx
const item = <li>felix</li>;
const list = <ul>{item}</ul>;        // Node branch: appended
```

A function is called, and its return value is composed:

```jsx
const Stamp = () => <time>{new Date().toISOString()}</time>;
<footer>{Stamp}</footer>;            // function branch → Node branch
```

A promise resolves, then the resolved value re-enters the chain:

```jsx
const data = fetch('/items').then(r => r.json()).then(items =>
  <ul>{items.map(i => <li>{i.name}</li>)}</ul>
);
<main>{data}</main>;                 // Promise branch → Node branch
```

An async generator yields deltas; each yield replaces the previous content:

```jsx
async function* clock() {
  while (true) {
    yield <time>{new Date().toLocaleTimeString()}</time>;
    await new Promise(r => setTimeout(r, 1000));
  }
}
<div>{clock()}</div>;                // asyncIterator branch, replace each tick
```

A `ReadableStream` is an async iterable — each chunk replaces, like any
other source. To accumulate chunks (a log, streamed text), opt in upstream:

```jsx
<pre><Channel source={logStream} append /></pre>;   // chunks pile up
```

For more on async sources, see [async-and-channels](async-and-channels.md).

## Foot-gun: spread-children

JSX has a `{...spread}` form for attributes. Some toolchains have, by
coincidence of `createElement`'s argument shape, also accepted
`{...array}` inside element children. **Azoth does not support spread-
children**, and there is no need for it — arrays are already valid child
values:

```jsx
const items = ['a','b','c'].map(x => <li>{x}</li>);

<ul>{...items}</ul>     // not supported — compiler error
<ul>{items}</ul>        // correct — array branch handles each element
```

Pass the array. The array branch maps and composes each element in order.
See [known-limitations](known-limitations.md) for the full note.

## See also

- [JSX as DOM](jsx-as-dom.md) — why a slotted `Node` is just appended
- [Components](components.md) — component interpolation and props
- [Attributes and properties](attributes-and-properties.md) — attribute
  interpolation, static vs dynamic
- [Async and channels](async-and-channels.md) — promises, generators,
  streams, subscriptions
- [Maya runtime](maya-runtime.md) — compose, replace, blocks, renderer
- [Known limitations](known-limitations.md) — including spread-children
- [For LLMs](for-llms.md) — terminology discipline
