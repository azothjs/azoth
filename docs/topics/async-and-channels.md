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

## Channel: sync render + async update

Often you want something on screen *immediately* and the async value to
take over when it arrives. That's the Channel pattern: a synchronous
value composed right away, plus an async source for future values.

```jsx
import { Channel } from '@azothjs/maya/compose';

<div>
    {Channel.from(
        <p>Loading…</p>,
        fetchData().then(data => <Results data={data} />)
    )}
</div>
```

The first argument composes immediately; the second drives subsequent
updates at the same slot. The `<Channel>` JSX form (below) is the usual
way to produce these. Full mechanics live in
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
| `source`  | required | The async data source. `Promise`, async iterable, `ReadableStream`, or `Observable` (anything with `.subscribe`). May also be another `Channel` instance (unwrapped). |
| `as`      | optional | Transform function `data → DOM`. A component reference works directly: `as={Cat}` is the same as `as={data => <Cat {...data} />}` when the data shape matches the props. |
| `error`   | optional | Transform function `error → DOM`. When the source produces an error, the result is rendered in place. Without an `error` prop, source errors propagate uncaught. |
| `map`     | optional | Boolean. When the source's value is an array, applies `as` per element instead of to the whole array. Has no effect on non-array values. |
| children  | JSX      | Initial render value, shown before the source produces its first value. Does **not** go through `as`. |

### Source types

The source can be any of:

- **Promise** — resolves once; the resolved value (passed through `as`)
  becomes the slot content.
- **Async iterable** (anything with `[Symbol.asyncIterator]`) — each
  yielded value replaces the previous content.
- **ReadableStream** — chunks accumulate at the slot (matching the
  stream-as-payload model). With `as`, each chunk is piped through a
  `TransformStream` first.
- **Observable** (anything with `.subscribe`) — TC39 proposal shape;
  RxJS-compatible. Each emitted `next` value replaces; `complete`
  ends iteration; `error` flows through the `error` prop if provided.
- **Channel** — unwrapped. The wrapped Channel's `.initial` becomes the
  outer Channel's initial (passed through `as`); the wrapped `.source`
  drives subsequent updates.

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

// ReadableStream (chunks accumulate)
<Channel source={response.body} as={chunk => decoder.decode(chunk)} />

// Observable
<Channel source={someObservable} as={Tile} />
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

**`ReadableStream` accumulates; it does not replace.** Streams append each
chunk at the slot. If you want replace semantics over time, use an async
iterator instead.

**Async iterators are single-consumer.** A given async iterator can be
read once. If you need to fan-out to multiple consumers, that's an
observable concern — use RxJS or the TC39 Observable proposal. Channel
itself is one-to-one (single source → single downstream).

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
- [Maya runtime](maya-runtime.md) — `Channel`, compose internals
- [For LLMs](for-llms.md) — terminology discipline
- [Known limitations](known-limitations.md) — current foot-guns
