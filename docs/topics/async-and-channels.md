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

## The four async sources Azoth accepts

Anywhere a `{…}` child slot accepts a value (see
[composition](composition.md)), it also accepts an async data source. The
runtime resolves each value the source produces and places it at that
position in the DOM.

| Source                              | Detection                         | Behavior                                   |
| ----------------------------------- | --------------------------------- | ------------------------------------------ |
| `Promise`                           | `instanceof Promise`              | Resolved value composed into the slot      |
| Async iterator / async generator    | `[Symbol.asyncIterator]` present  | Each yielded value **replaces** the previous |
| `ReadableStream`                    | `instanceof ReadableStream`       | Each chunk **accumulates** at the slot     |
| Observable                          | `.subscribe` / `.on` (planned)    | Each emission replaces the previous (planned) |

A Promise delivers a single value. An async iterator delivers a sequence,
with each value taking the slot from the previous. A `ReadableStream` is
the exception — it appends rather than replaces, matching how streams are
typically consumed.

Observables (`.subscribe` / `.on`) are reserved in the compose dispatch
table for upcoming work; today the established async sources are Promises
and async iterators, with streams in the accumulating role.

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

## SyncAsync: sync render + async update

Often you want something on screen *immediately* and the async value to
take over when it arrives. That's the SyncAsync pattern: a synchronous
value composed right away, plus an async source for future values.

```jsx
import { SyncAsync } from '@azothjs/maya/compose';

<div>
    {SyncAsync.from(
        <p>Loading…</p>,
        fetchData().then(data => <Results data={data} />)
    )}
</div>
```

The first argument composes immediately; the second drives subsequent
updates at the same slot. Most authors never construct `SyncAsync`
directly — the `channel()` function (below) returns one when it makes
sense. Full mechanics live in [maya-runtime](maya-runtime.md).

## `channel()` — the canonical helper

`channel()` from `@azothjs/chronos/channels` is the workhorse for piping
an async source through a transform into a DOM slot.

```jsx
import { channel } from '@azothjs/chronos/channels';

const profileCard = channel(fetchProfile(), ProfileCard, { start: <Loading /> });

<div>{profileCard}</div>
```

### Signature

```
channel(asyncSource, transform, options)
```

- `asyncSource` — a `Promise` or async iterator. Required.
- `transform` — a function `data → DOM`. A component reference works
  directly (`as={Cat}` is the same as `as={data => <Cat {...data} />}` when
  the data shape matches the props).
- `options` — see below.

### Options

| Option  | Type      | Description                                                                                       |
| ------- | --------- | ------------------------------------------------------------------------------------------------- |
| `start` | any value | Initial DOM/value rendered immediately. **Does not** go through `transform`. Useful for loading UI. |
| `init`  | any value | Initial value that **does** go through `transform`. Useful when seeding with a default data shape. |
| `map`   | boolean   | If the async source yields arrays, apply `transform` to each item instead of the array as a whole. |

`start` and `init` are mutually exclusive — `channel` throws if you supply
both when the async source is already a `SyncAsync`.

### Return shape

What `channel()` returns depends on what you gave it:

- Promise input, no `start`/`init` → a Promise (the transformed result)
- Promise input with `start`/`init` → a `SyncAsync` (sync part + the promise)
- Async iterator input → an async generator that yields transformed values
- Async iterator with `start` → an async generator that yields `start`
  first, then transformed values

The return value goes wherever a value goes in JSX:

```jsx
// Promise + start: loading UI then resolved data
const card = channel(fetchProfile(), ProfileCard, { start: <Loading /> });
<div>{card}</div>

// Async iterator with map: a list that grows
async function* incoming() { /* yields arrays */ }
const items = channel(incoming(), Cat, { map: true, start: <Empty /> });
<ul>{items}</ul>

// init: seed with default data through the same transform
let count = 0;
const counter = channel(asyncCount(), n => <span>{n}</span>, { init: count });
<div>{counter}</div>
```

## Supporting helpers

The `@azothjs/chronos/channels` module ships three helpers around
`channel()`.

**`tee(asyncSource, count = 2)`** — Split one async source into multiple
independent feeds. Necessary because async iterators are single-consumer.

```jsx
const [a$, b$] = tee(events$);
```

**`branch(asyncSource, ...transforms)`** — Split *and* transform in one
call. Each transform becomes its own channel.

```jsx
const [Count, List] = branch(fetchCats(),
    cats => cats.length,
    [Cat, { map: true, start: <Loading /> }],
);
```

**`consume(asyncSource, sideEffect, options?)`** — Subscribe to an async
source for side effects without producing DOM. The `start` option is
rejected (there is nothing to render); `init` and `map` work as usual.

```jsx
consume(theme$, t => document.documentElement.className = t);
```

## The aspirational `<Channel>` JSX form

A built-in `<Channel>` component is planned (tracked in
[TODO.md](../../TODO.md)). The API will be:

```jsx
// Upcoming — not yet implemented
<Channel async={results$} as={r => <SearchResults results={r} />} />

<Channel async={fetchUserContext()} as={data => <LandingPageView {...data} />}>
    <Loading />
</Channel>
```

- `async` — the async data source
- `as` — the transform; receives data directly
- children — initial content rendered until `async` delivers (equivalent
  to the `start` option on `channel()`)

Until then, the `channel()` function with `{ start: <Loading /> }` is the
established form, and `<Channel>` is being prototyped in downstream apps.

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
not what it contains. `CardView` internally calls `channel()` with a
loading element. See [workflow](workflow.md) for the full pattern, the
`CardView` implementation, and where data fetching lives.

## Foot-guns

**A channel passed as a prop is not auto-resolved.** Channels — and
async sources in general — resolve only inside child interpolation slots.
When you pass one as a prop, the prop receives the channel object, the
Promise, or the async iterator itself.

```jsx
// Resolves: channel is in a child slot
<div>{channel(fetchProfile(), ProfileCard)}</div>

// Does NOT resolve: prop receives the channel as-is
<Wrapper data={channel(fetchProfile(), ProfileCard)} />
```

If a child component needs the resolved value, either:

- pass the async source and let the child put it in its own child slot,
- or `await` the value before constructing the parent JSX.

**`ReadableStream` accumulates; it does not replace.** Streams append each
chunk at the slot. If you want replace semantics over time, use an async
iterator instead.

**Async iterators are single-consumer.** Sharing requires `tee` or
`branch`. Promises can be shared safely because each `.then()` receives
the resolved value.

**Don't reach for `useState` or `useEffect`.** There are none. The async
source is the data flow. The slot is where it lands. The transform is the
shape. See [for-llms](for-llms.md) for terminology discipline.

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
- [Maya runtime](maya-runtime.md) — `SyncAsync`, compose internals
- [For LLMs](for-llms.md) — terminology discipline
- [Known limitations](known-limitations.md) — current foot-guns
