# Hypermedia

> The reframe that unlocked Azoth for me: **events are deltas.** The UI
> evolves through a sequence of change instructions, each triggered by an
> event. There's no "current state" being computed into a "next render."
> There's the DOM as it currently is, plus the next event that modifies
> it.
>
> I came in looking for the data store — where the source of truth lives,
> how it propagates, what drives recomputation. None of that is here. The
> DOM *is* the current UI. An event arrives. It delivers a Δ. The DOM is
> now slightly different. That's the whole loop. Once I stopped asking
> "what state owns this?" and started asking "what layout change happens
> when this event fires?", the architecture clicked.

## The formalism

State-driven frameworks model the UI as a function of state:

```
ui = fn(state)
```

The renderer's job is to keep the UI in sync with the state. State is the
source of truth; the UI is a projection.

Azoth models the UI as a sequence of deltas applied to the prior UI:

```
ui₀  = initial render
ui₁  = ui₀ + Δ
ui₂  = ui₁ + Δ
...
uiₙ  = uiₙ₋₁ + Δ
```

Each Δ is delivered by an event. The DOM is the source of truth; events
modify it in place. There is no separate state being projected — the UI
already exists, and the next event tells it how to change.

These two models are mutually exclusive. State and UI cannot *both* be the
source of truth.

## Three event sources

Every change to an Azoth UI arrives through one of three channels:

1. **Page load.** The initial render. Templates clone, slots bind, the DOM
   appears. This is `ui₀`.
2. **Async data sources.** Promises resolving, async generators yielding,
   streams emitting, observables firing. Each firing IS a delta — see
   [async-and-channels](../../packages/valhalla/channels.test.tsx).
3. **DOM events.** User input, browser events (`resize`, `visibilitychange`),
   programmatic dispatch. Standard `addEventListener` and inline
   `on*={…}` handlers. These come from outside the Azoth boundary because
   the boundary is the DOM itself.

A handler for a DOM event can mutate the DOM directly, or dispatch a new
async action that delivers a future delta. Either way, the next Δ flows
into the same UI it modifies.

## Why this isn't novel

The browser has always been event-driven. The platform was designed this
way. DOM events fire on elements; handlers respond; the document updates.

Frameworks introduced an abstraction layer on top of an already-event-driven
system: a virtual DOM, synthetic events, component state held separately
from DOM state, reconciliation to sync the two.

Azoth doesn't add that layer. It works with the browser's native event
loop, native events, and the real DOM. The "innovation" is mostly
*subtraction* — the abstraction was never introduced, so there's nothing
to escape from when you want a `dialog`, an `IntersectionObserver`, or
GSAP.

## Layout management, not state management

This is the reframe Azoth invites.

**State-driven thinking:**

> "What data do I need to store? Where does it live? When does it
> change? What re-renders when it does? What's the dependency array?"

**Layout-driven thinking:**

> "What layout change happens when this data arrives? Where in the DOM
> does it go? What's the source that delivers it?"

Same problem, different center of gravity. The state-driven version
optimizes for *holding* data so the renderer can re-derive the UI from it.
The layout-driven version skips the holding step — the async source pipes
directly into the slot where the change lands.

### React vs Azoth, side by side

Fetch a list and render it.

**React** — fetch into state, then render from state:

```jsx
function App() {
    const [emojis, setEmojis] = useState([]);
    useEffect(() => {
        fetchEmojis().then(setEmojis);
    }, []);
    return (
        <ul className="emojis">
            {emojis.map(e => <Emoji {...e} />)}
        </ul>
    );
}
```

The pattern: declare state, fire an effect, set state, let the component
re-render with the new state, project that state to JSX.

**Azoth** — the fetch *is* the layout instruction:

```jsx
function App() {
    return (
        <ul class="emojis">
            {fetchEmojis().then(emojis => emojis.map(e => <Emoji {...e} />))}
        </ul>
    );
}
```

The Promise lands in the slot. When it resolves, the resolved DOM takes
the slot. No state declaration, no effect, no dependency array, no
re-render. The async data source is the layout instruction.

You can wrap the source in `<Channel>` to add a loading state, transform,
or sequence — see [channels.test.tsx](../../packages/valhalla/channels.test.tsx) — but the
core shape is what's above. The Promise goes where the DOM goes.

## Connection to async data sources

Every value an async source produces is the next DOM for its slot. The
compose engine doesn't care whether the source is a Promise, an async
generator, a stream, or an observable — it treats each emission as a
delta to apply at the slot.

```
async source → next value → Δ at the slot → ui ← ui + Δ
```

This is why Azoth doesn't need state in the React sense. The async source
is already the data flow. The slot is already the destination. The
transform is already the shape. Putting a state variable between them
would be adding a buffer where one isn't needed.

See [channels.test.tsx](../../packages/valhalla/channels.test.tsx) for the async source
types and `<Channel>`.

## Distinction from HTMX / HDA

[HTMX](https://htmx.org) and the Hypermedia-Driven Application architecture
share Azoth's foundational model — UI evolves through deltas, not
re-renders — but draw the line in a different place.

| Aspect              | HTMX / HDA                       | Azoth                              |
| ------------------- | -------------------------------- | ---------------------------------- |
| Delta source        | Server response (HTML over wire) | Async data sources + DOM events    |
| Delta payload       | HTML fragments                   | DOM nodes (built client-side)      |
| Where the work runs | Mostly server                    | Client (JS for everything dynamic) |
| Hypermedia "side"   | Server-driven                    | Client-driven                      |

Same shape (deltas modifying live media), different origin. HTMX moves
HTML across the network on each interaction. Azoth produces DOM on the
client, from JSX, in response to local events and async sources. Both
treat the rendered content as the source of truth. Neither maintains a
parallel data graph that the UI is derived from.

If your interactions are rich and local (animations, transitions,
client-side composition), Azoth's side is the natural fit. If your
interactions are mostly request/response with the server, HTMX is. The
underlying architecture is compatible.

## Forward-looking: platform alignment

The WICG [Observable proposal](https://github.com/WICG/observable)
adds native observables to the platform, including
`EventTarget.prototype.when()` — a method that returns an Observable of DOM
events from any event target (shipped in Chrome; Firefox implementing).

That maps onto Azoth's model exactly. A DOM event stream is just another
async data source. Today, `<Channel>` bridges the EventTarget directly:

```jsx
<div><Channel source={button} eventType="click" as={click => <p>clicked at {click.timeStamp}</p>} /></div>
```

With native `when()` the source side becomes a platform primitive —
compose already accepts anything with `.subscribe`:

```jsx
<div><Channel source={button.when('click')} as={click => <p>clicked at {click.timeStamp}</p>} /></div>
```

DOM events flow directly into Azoth's compose chain. No framework
intermediary, no synthetic event layer, no library to install. The compose
engine already accepts observables (the `.subscribe` branch of its
dispatch — see [channels.test.tsx](../../packages/valhalla/channels.test.tsx));
the platform is moving toward producing them natively.

Azoth was designed to be ready for this, not depend on it.

## The state question

State isn't *banned* in Azoth. It's decoupled.

If your application has data that needs to persist across events, live in
memory, sync to storage, coordinate between distant parts of the UI —
that's a real concern, and Azoth doesn't pretend it isn't. Bring your own
state library. RxJS, Solid signals, plain observables, a hand-rolled
store, whatever fits the problem.

The decoupling: Azoth consumes the async outputs of your state library. A
signal that emits values becomes an async source in a slot. A store with
a `.subscribe()` becomes a channel. Whatever delivers an async sequence
delivers deltas to the DOM.

What Azoth doesn't do is *require* state to render. The simple case —
fetch and display — needs no store, no effect, no dependency array. The
async source plugs straight into the slot. State enters only when the
problem genuinely calls for it.

## Foot-gun the LLM corpus pulls toward

- **Reaching for `useState` because "the data has to live somewhere."**
  The Promise / async generator / stream is where it lives. The slot is
  where it lands. See [async-and-channels](../../packages/valhalla/channels.test.tsx).
- **Thinking of a fetch handler as setting state.** It isn't — it's
  returning the next DOM. The pattern is `data => DOM`, not
  `data => setState(data)`.
- **Asking "when does this re-render when state changes?"** It doesn't,
  because there's no render cycle. The next event delivers the next Δ.
- **Modeling DOM events as triggers for state mutations that drive
  re-renders.** Skip the middle steps. The handler can mutate DOM
  directly, or dispatch the async action that delivers the next delta.

## See also

- [JSX as DOM](jsx-as-dom.md) — why the DOM is the source of truth
- [Async and Channels](../../packages/valhalla/channels.test.tsx) — async sources as delta
  feeds; the `channel()` helper
- [Composition](../../packages/valhalla/compose.test.tsx) — what `{…}` slots accept, and how
  values land at them
- [Maya runtime](../design/core-rules.md) — how the compose engine applies each
  delta
- [For LLMs](for-llms.md) — terminology discipline (delta, channel,
  async source — not "state," "re-render," "hooks")

## Further reading

- [`docs/history/hypermedia.md`](../history/hypermedia.md) — the longer essay this topic
  page distills, with the React-vs-Azoth comparison in full
- [`docs/history/MENTAL-MODEL.md`](../history/MENTAL-MODEL.md) — sections "The
  Fundamental Model: Events = Deltas," "Alignment with the Original Web
  Platform," and "Layout Management, Not State Management"
