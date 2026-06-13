# Async and Channels

> In Azoth, an async data source *is* a layout instruction. A Promise
> resolving means "here's the new DOM for this position." An async
> generator yielding means "and now this DOM." A stream emitting means
> "and this DOM, after the last one."
>
> I came in looking for state. Where do I store the fetched data? When does
> the component re-run with the new value? How do I wire effects to
> re-fetch? None of that is here. The async source goes directly into the
> interpolation slot, and Azoth treats every value it produces as the next
> DOM for that slot.
>
> Once that landed, the question shifted. Not "what state do I need" but
> "what layout change happens when this data arrives?" That's the whole
> mental model. Layout management, not state management.

## Async sources Azoth accepts

Anywhere a `{…}` child slot accepts a value (see
[composition](composition.md)), it also accepts an async data source. The
runtime resolves each value the source produces and places it at that
position in the DOM.

| Source                              | Detection                         | Behavior                                   |
| ----------------------------------- | --------------------------------- | ------------------------------------------ |
| `Promise`                           | `instanceof Promise`              | Resolved value composed into the slot      |
| Async iterator / async generator    | `[Symbol.asyncIterator]` present  | Each yielded value **replaces** the previous |
| `ReadableStream`                    | `instanceof ReadableStream`       | Each chunk **accumulates** at the slot     |
| Observable                          | `.subscribe` is a function        | Each emission replaces the previous        |
| `EventTarget`                       | `instanceof EventTarget` (Channel only) | Each event of the configured type renders via `as` |

A Promise delivers a single value. An async iterator delivers a sequence,
with each value taking the slot from the previous. A `ReadableStream` in
a raw slot is the exception — chunks append rather than replace, matching
how streams are typically consumed. Observables follow the TC39 proposal
shape (also RxJS-compatible): each `next` value replaces, `complete` ends
iteration, `error` re-throws unless wrapped in a
[Channel](#channel--the-canonical-surface) with an `error` prop.
`EventTarget` is Channel-only — compose alone can't bridge events into
the slot because there's no way to express which event type to listen
for; the `eventType` prop on `<Channel>` fills that role.

When you wrap an async source in a `<Channel>` (see below), the semantic
is uniform: each value **replaces** by default; opt into accumulation
with the `append` prop. Channel treats `ReadableStream` as an async
iterable (modern streams have `[Symbol.asyncIterator]`), so the
accumulate-vs-replace decision is yours via `append` rather than implied
by the source type.

## Plain async patterns first

Before reaching for channels, recognize that the JSX slot itself accepts
async values directly. A Promise in a `{…}` slot is the simplest case:

```jsx
const Results = ({ data }) => <ul>{data.map(d => <li>{d.name}</li>)}</ul>;

<div>{fetchData().then(data => <Results data={data} />)}</div>
```

The promise resolves, the `.then` callback returns DOM, and that DOM lands
in the slot. No state hook, no effect, no dependency array.

Error handling happens in context, using normal JavaScript:

```jsx
async function loadList() {
    try {
        const items = await fetchItems();
        return <List items={items} />;
    } catch (err) {
        return <Oops error={err} />;
    }
}

<div>{loadList()}</div>
```

An async function that returns DOM *is* a layout instruction. The Promise
it returns flows into the slot. Errors caught inside the function return
fallback DOM through the same channel.

## Channel: sync render + async update

Often you want something on screen *immediately* and the async value to
take over when it arrives. That's the Channel pattern — a synchronous
initial render, plus an async source for future values. The canonical
surface is the `<Channel>` JSX component below; full mechanics live in
[maya-runtime](maya-runtime.md).

## `<Channel>` — the canonical surface

`<Channel>` is a JSX component from `@azothjs/maya/channels`. The class
IS the component — `<Channel ...>` JSX and `new Channel(...)` produce
the same instance; one is just syntax for the other.

```jsx
import { Channel } from '@azothjs/maya/channels';

<main>
    <Channel source={fetchProfile()} as={ProfileCard}>
        <Loading />
    </Channel>
</main>
```

### Props

| Prop      | Type     | Description                                                                                              |
| --------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `source`    | required | The async data source. `Promise`, async iterable (covers async generators, `ReadableStream`, any AsyncIterable), `Observable` (anything with `.subscribe`), or `EventTarget` (paired with `eventType`). |
| `eventType` | required when `source` is an `EventTarget` | Name of the event to listen for (e.g. `"click"`, `"message"`). Mismatched with non-EventTarget sources is an error. |
| `as`        | optional | Transform function `data → DOM`. A component reference works directly: `as={Cat}` is the same as `as={data => <Cat {...data} />}` when the data shape matches the props. For `EventTarget` sources, `as` receives the `Event` object. |
| `error`     | optional | Transform function `error → DOM`. When the source produces an error, the result is rendered in place. Without an `error` prop, source errors propagate uncaught. (EventTarget sources have no error channel; this catches transform exceptions only.) |
| `map`       | optional | Boolean. When the source's value is an array, applies `as` per element instead of to the whole array. Has no effect on non-array values. |
| `append`    | optional | Boolean. When set, the first source value replaces the initial render; subsequent values **append** rather than replace. Without it (the default), each source value replaces the previous. No visible effect on `Promise` sources (only one value). |
| children    | JSX      | Initial render value, shown before the source produces its first value. Does **not** go through `as`. Replaced by the first source value. |

### Source types

Channel accepts four shapes:

- **Promise** — resolves once; the resolved value (passed through `as`)
  becomes the slot content. `append` has no visible effect (only one
  value).
- **Async iterable** (anything with `[Symbol.asyncIterator]`) — each
  yielded value replaces the previous; with `append`, the first value
  replaces the initial render and subsequent values accumulate. This
  category includes async generators, modern `ReadableStream` (which
  implements `[Symbol.asyncIterator]`), and any other AsyncIterable.
- **Observable** (anything with `.subscribe`) — TC39 proposal shape;
  RxJS-compatible. Each `next` value replaces (or accumulates with
  `append`); `complete` ends iteration; `error` flows through the `error`
  prop if provided, otherwise propagates uncaught.
- **EventTarget** (anything `instanceof EventTarget`) — paired with the
  `eventType` prop. Each event of that type flows through `as` and lands
  in the slot. Covers DOM elements (clicks, input), WebSockets (messages),
  BroadcastChannel, MediaQueryList, and the many other platform APIs that
  extend EventTarget. Channel registers the listener on construction and
  removes it when the slot is abandoned. Once `EventTarget.prototype.when()`
  ships (WICG Observable proposal), the same `target.when('event')` will
  flow through the Observable detection branch automatically.

### Replace vs append

By default, Channel **replaces** the prior value at the slot on every
source emission. This matches the most common pattern (loading state →
resolved data; new event → updated view).

When you want chunks to accumulate — chat messages streaming in, a
progress log, partial-then-final results — set `append`. The first source
value replaces the initial render (placeholder goes away); each
subsequent value appends after the prior:

```jsx
<Channel source={chatStream} as={Message} append>
    <p>Connecting…</p>
</Channel>
```

Without `append`, the same `<Channel source={chatStream}>` would render
only the most recent chunk. Pick based on intent, not on the source's
data type.

### Examples

```jsx
// Promise + initial loading state
<Channel source={fetchProfile()} as={ProfileCard}>
    <Loading />
</Channel>

// Async iterator (e.g. SSE events)
<Channel source={events$} as={Notification} />

// Array data — map applies `as` per element
<Channel source={fetchCats()} as={Cat} map>
    <Empty />
</Channel>

// Error handling
<Channel
    source={fetchProfile()}
    as={ProfileCard}
    error={err => <ErrorBanner message={err.message}/>}
>
    <Loading />
</Channel>

// ReadableStream — replace by default (only the last chunk visible)
<Channel source={response.body} as={chunk => decoder.decode(chunk)} />

// ReadableStream with append — chunks accumulate (e.g. SSE-style fan-in)
<Channel source={response.body} as={chunk => decoder.decode(chunk)} append />

// Observable
<Channel source={someObservable} as={Tile} />

// EventTarget — DOM element clicks
<Channel source={button} eventType="click" as={() => <Toast/>}>
    <Empty />
</Channel>

// EventTarget — WebSocket messages, append-style chat log
<Channel source={socket} eventType="message" as={({data}) => <Message text={data}/>} append>
    <p>Connecting…</p>
</Channel>
```

### As a value, not just JSX

`<Channel>` at the top of a JSX expression returns the `Channel`
instance — it's a class component (per the talk's "component =
constructor"). You can hold it as a value and interpolate later:

```jsx
const profile = <Channel source={fetchProfile()} as={ProfileCard}>
    <Loading />
</Channel>;

// Later, in some other JSX:
<main>{profile}</main>
```

Equivalent to:

```jsx
const profile = new Channel({ source: fetchProfile(), as: ProfileCard }, <Loading/>);
<main>{profile}</main>
```

Either form works; pick what reads cleaner where you're using it.

## `pushable` — bridge from callback APIs to Channel

When your source isn't already a Promise, async iterable, Observable, or
EventTarget — e.g. a third-party library that gives you a callback API —
`pushable()` bridges push-driven callbacks into the async-iterable shape
Channel expects.

```js
import { pushable } from '@azothjs/maya/channels';

const [events$, push] = pushable();
someLibrary.onUpdate(value => push(value));

// elsewhere in JSX:
<Channel source={events$} as={Item} />
```

`pushable()` returns `[asyncIterator, pushFn]`. Values pushed before
iteration are queued FIFO; values pushed while a consumer is awaiting
wake it immediately. There is no transform — that's `Channel.as`'s job
(or iterator helpers downstream). The single responsibility is the
push-to-pull bridge.

Async iterators are single-consumer; if you need fan-out, lift the
source into an `EventTarget` (naturally multi-listener) and use
Channel's EventTarget integration per consumer.

`pushable` is also what Channel uses internally for its `EventTarget`
support — `fromEventTarget(target, eventType, ...)` is essentially
`pushable()` plus `addEventListener` plus listener cleanup. If you ever
need a different platform-source-to-iterable bridge, `pushable` is the
building block.

## The View + CardView idiom

The production pattern for async-loaded layout is a clean split:

- **`XxxView`** — pure presentation. Receives props. Testable in
  isolation with mock data.
- **`Xxx`** — async wrapper. Accepts an `async` prop and feeds it through
  `CardView` (a shared shell that handles card chrome and loading state).

```jsx
export const AgentProfileView = ({ name, market, profileUrl }) => (
    <div class="agent-profile">
        <img src={profileUrl} alt={name} />
        <span>{name}</span>
    </div>
);

export const AgentProfile = ({ async }) => (
    <CardView class="agent-profile"
              async={async}
              Component={AgentProfileView}
              loadingHeight="2em" />
);
```

The `async` prop name is the convention — it says how the value is *used*,
not what it contains. `CardView` internally constructs a `Channel` with
the loading element as childNodes. See [workflow](workflow.md) for the
full pattern, the `CardView` implementation, and where data fetching
lives.

## Foot-guns

**A Channel (or async source) passed as a prop is not auto-resolved.**
Async sources resolve only inside child interpolation slots. When you
pass one as a prop, the prop receives the value as-is — the Promise,
the iterator, or the Channel instance itself.

```jsx
// Resolves: source flows through Channel in a child slot
<main>
    <Channel source={fetchProfile()} as={ProfileCard}>
        <Loading/>
    </Channel>
</main>

// Does NOT resolve: prop receives the Channel instance as-is
<Wrapper data={<Channel source={fetchProfile()} as={ProfileCard}/>} />
```

If a child component needs the resolved value, either:

- pass the async source and let the child put it in its own child slot,
- or `await` the value before constructing the parent JSX.

**Raw `ReadableStream` in a slot accumulates; `<Channel>`-wrapped streams
replace by default.** Two different mental models for two different
contexts. A raw `{stream}` interpolation is "stream-as-payload" — chunks
append. A `<Channel source={stream}>` is "give me transformed values one
at a time" — each replaces. Add `append` on the Channel to accumulate
there too.

**Async iterators are single-consumer.** A given async iterator can be
read once. If you need to fan-out to multiple consumers, that's an
observable concern — use RxJS or the TC39 Observable proposal. Channel
itself is one-to-one (single source → single downstream).

**Don't reach for `useState` or `useEffect`.** There are none. The async
source is the data flow. The slot is where it lands. The transform is the
shape. See [for-llms](for-llms.md) for terminology discipline.

## IGNORE — skipping a value without clearing the slot

`@azothjs/maya/compose` exports a sentinel `IGNORE`. When a source emits
`IGNORE`, compose treats it as "do nothing for this emission" — the slot
stays as it was. Distinct from `null` / `undefined` / `''`, which all
**clear** the slot.

```js
import { IGNORE } from '@azothjs/maya/compose';

async function* heartbeat() {
    for await (const event of source) {
        if (isHeartbeat(event)) yield IGNORE; // keep the current view
        else yield <View {...event} />;
    }
}
```

Useful for sources that interleave meaningful values with bookkeeping
events (heartbeats, ping/pongs, idle ticks). Today it's a small utility;
if a clear authoring pattern shows demand for a dedicated prop or
static, that's a future addition.

The same sentinel works as a **return from a rerenderer thunk** — keep the
current DOM for this pass without clearing it:

```js
rerenderer(({ id }) => {
    if (id === lastId) return IGNORE; // unchanged → keep current view
    lastId = id;
    return <Detail id={id} />;
});
```

`return null` / `undefined` from a thunk would **clear** the slot — only
`IGNORE` is a true no-op once a value reaches compose. (Note the contrast
with a UIComponent's `update()`, where a bare `return;` *is* the no-op:
there `composeComponent` intercepts `undefined` before it reaches compose.
`IGNORE` is for the flows you can't intercept upstream — source emissions
and thunk returns.)

## What this is *not*

A subtraction, not a contrast. Things that simply do not exist:

- No state to manage between renders — the component runs once
- No effect/dependency system — async functions and `.then` are the deps
- No reconciliation when data arrives — the slot is updated in place
- No render cycle for channels to drive — they drive DOM directly

## See also

- [JSX as DOM](jsx-as-dom.md) — why a transform returning JSX returns DOM
- [Composition](composition.md) — what `{…}` slots accept
- [Components](components.md) — function/class form; the View pattern
- [Workflow](workflow.md) — View + CardView in full, data ownership
- [Hypermedia](hypermedia.md) — the events-as-deltas model
- [Maya runtime](maya-runtime.md) — `Channel`, compose internals
- [For LLMs](for-llms.md) — terminology discipline
- [Known limitations](known-limitations.md) — current foot-guns
