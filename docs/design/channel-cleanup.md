# Design Note: Channel Cleanup and Subscription Lifecycle

**Status:** Open. Needs a story before 1.0; not blocking the API freeze on `<Channel>` shape (`source` / `as` / children).

## The motivating case

List/detail UI where the detail view is bound to a WebSocket source (native, Supabase, Firebase, an EventSource, etc.). Each click in the list must:

1. Stop the previous detail's subscription
2. Subscribe to the new detail's source

This is a routine pattern any framework has to handle cleanly. Get it wrong and you leak connections, double-render, or silently corrupt state on every navigation.

## Marty's framing (verbatim)

> I'd want it to fall to whatever is managing the change. But the Channel has a subscription so that needs to be managed. So first question is can the subscriber be made moot by the subject? Alternately, is there a layer above what gets passed to channel as source that makes that switch opaque to channel? Is there another pattern?

## Two distinct concerns

The cleanup question has two layers that need separate answers:

### (a) Consumer-side cancellation

The caller wants to *stop* a source mid-stream — abandon the WebSocket because the user clicked a different item. This is a **platform** concern:

- Observable → `subscription.unsubscribe()`
- AbortController → `controller.abort()` cancels fetches, WebSockets-with-signal, etc.
- WebSocket → `socket.close()`
- ReadableStream → `reader.cancel()`
- Custom EventSource → `source.close()`

**Position:** Channel should NOT add API for this. The caller uses the source's own cancellation primitive. Channel just consumes whatever it's given and unwinds when the source stops.

### (b) Channel-side cleanup

When `<Channel>` is removed from the DOM (because its containing render swapped out, the route changed, the parent re-rendered), Channel should detect that and stop processing its source internally. Otherwise the inner async loop keeps trying to push values into a detached anchor.

The current async-iterator path (compose.js, `composeAsyncIterator`) already has a TODO acknowledging this:

```js
// TODO: use iterator directly and
// - control return when removed, and maybe throws on error
// - possible yield/return semantics for third communication channel
```

So the gap is already known. The question is the mechanism.

**Position:** Channel needs this. The user does not.

## Mechanism options for (b)

### Option 1: MutationObserver on anchor parent

Observe the anchor's parent for `childList` mutations. When the anchor is removed, fire cleanup.

**Pros:** Standard platform mechanism. Self-contained per Channel.

**Cons:** Overhead per Channel instance. At list scale (hundreds of Channels), the observer count matters. Also a race: the observer fires *after* removal — the next async push may already be queued.

### Option 2: Renderer-driven signal

The renderer (cached DOM + replay) knows when it's replacing content. On replace, it could signal cleanup to the outgoing subtree's subscriptions explicitly — propagate a "you're being removed" through the anchor.

**Pros:** Deterministic. Synchronous with the swap. No per-instance observer.

**Cons:** Only works when the renderer (not direct DOM mutation) drives the swap. Anything that bypasses the renderer (e.g., user calls `el.remove()` directly) doesn't trigger it.

### Option 3: AbortSignal woven through compose

Each compose call carries an `AbortSignal`. When the anchor is removed by anything, the signal aborts, which the async iterator / observable subscribe loop respects via `signal.aborted` / passing the signal to the source.

**Pros:** Matches the platform's standard cancellation primitive. Composable with user-supplied AbortControllers (the caller can supply their own; Channel chains it).

**Cons:** Requires threading the signal through compose. Currently compose has no such argument.

### Option 4: Iterator return semantics

When the async iterator is removed-from-the-loop (the `for await` exits early), JavaScript's iterator protocol calls `iterator.return()`. Channel could leverage this: structure the consumption loop to break-out when the anchor goes invalid, triggering the iterator's own cleanup.

**Pros:** Aligns with the language's iterator semantics. Zero new API.

**Cons:** Only works for async iterators (not Promises, not Observables, not Streams). Mixed mechanism across source types.

## What I'd recommend (tentative)

A combination of Option 3 + Option 4:

- Thread an `AbortSignal` through compose internally. When a Channel is created, generate a signal; when the anchor is removed (detected by whatever mechanism — likely the renderer + a fallback MutationObserver), abort the signal.
- Async iterator path: respect the signal at the loop boundary, breaking out and triggering `iterator.return()`.
- Promise path: when signal aborts, abandon the `.then` (no rejection — just stop applying results).
- Observable path: pass signal to `.subscribe`, or wrap in a teardown.
- Stream path: `reader.cancel(reason)` with the signal's reason.

User-facing surface: **nothing.** No `cleanup`, no `onUnmount`, no `key`. The behavior is invisible.

User cancellation surface: **the source's own primitive.** Pass an `AbortSignal` into your `fetch`, pass your own `AbortController` to a custom source, call `subject.complete()` from outside — Channel doesn't care, it just notices the source stopped.

## The "subject moots the subscriber" question

Marty's first sub-question: can the subscriber become moot via the subject?

**Yes, in some shapes:**
- A finite Promise → resolves once, Channel applies result, no further work
- An async generator that returns → for-await exits, done
- An Observable that completes → subscription auto-ends

**No, in the WebSocket case:** the subject (the WebSocket) doesn't naturally complete on click-elsewhere. The consumer has to actively close it (or the connection has to drop). So the answer for the list/detail case is: the *caller* still has to abort, but they do so via the source's primitive (`socket.close()` or AbortController bound to the fetch that created the socket).

This is fine. Cleanup belongs where the resource is created. Channel doesn't own the WebSocket; the caller does. Channel only owns its own consumption loop, and (b) handles that.

## The "layer above" question

Marty's second sub-question: can a layer above the source make the switch opaque to Channel?

**Yes.** Wrap the WebSocket-per-selection logic in an observable (RxJS `switchMap` is exactly this pattern) or in a `BehaviorSubject` that swaps its inner source. The wrapper handles unsubscribe-old / subscribe-new internally; Channel sees one stable subject.

That's a state-management / data-layer concern, not an Azoth concern. Azoth provides the rendering integration; the consumer chooses the data composition strategy. This is the platform-alignment story playing out cleanly: Azoth accepts an Observable; the consumer uses RxJS (or an upcoming standard observable) to compose the WebSocket-switch logic.

## What we lock in for the API surface

`<Channel>` public surface stays:

- `source`
- `as`
- children (loading state)
- `error` (probably — see separate design note)

No `cleanup` prop. No `key` prop. No lifecycle hooks. The mechanism is invisible.

## What needs verification before 1.0

1. **Current behavior on anchor removal.** Does the async-iterator loop in compose.js leak when the anchor is detached? Crash? Silently no-op? Need a test that detaches mid-stream and asserts cleanup.
2. **MutationObserver overhead at scale.** Benchmark list-with-N-channels (N = 100, 1000, 10000) to see if the observer count is observable.
3. **Renderer hook for cleanup signal.** Can the renderer's existing replay-binding mechanism propagate cleanup? If yes, that's lighter than a per-Channel observer.
4. **Promise + AbortSignal interaction.** Does `fetch(url, { signal })` propagate cleanly? Standard pattern, should work, but verify.

## What can wait until after 1.0

- Observable-protocol support in compose (currently a TODO in compose.js lines 76-78). Once observables land natively in the platform or RxJS is the chosen userland answer, the subscribe/unsubscribe semantics will largely solve this category outside of Channel anyway.
- A `key`-style identity prop for forcing re-subscription within an unchanged DOM position. Probably not needed if removal-detection works correctly.

## Open thread for later

Marty mentioned MutationObserver in the error-prop context, not here. Worth noting: MutationObserver is also the platform mechanism for "the DOM changed, react to it." If the Channel-cleanup path uses MutationObserver, and the error-handling path uses MutationObserver, they're not the same use — but they share a primitive. Worth a single design pass to see if they can share infrastructure.
