# Async Rendering Patterns

*How Azoth connects asynchronous data sources to DOM layout.*

---

## The Core Concept

Azoth directly accepts asynchronous data structures in JSX. When an async value (Promise, async generator, observable, stream) appears in the template, Azoth manages the lifecycle of delivering resolved values to that location in the DOM.

The component syntax (`<Channel>`, etc.) lets you express both *what* happens when data arrives and *where* it happens, directly in the template tree. This is layout management, not state management.

---

## Established: Channel

**Channel** is the workhorse async-to-DOM pattern. Each value from the async source is transformed via the `as` function and **replaces** the previous DOM at that location.

```jsx
<Channel async={fetchProfile()} as={ProfileCard}>
    <Loading />
</Channel>
```

**Lifecycle:**
1. Child content (`<Loading />`) renders synchronously as initial DOM
2. When promise resolves, `as` function transforms the data into new DOM
3. New DOM replaces the child content at that anchor point
4. For multi-value sources (generators, streams), each value replaces the previous

**Props:**
- `async` — The async data source (Promise, async generator, etc.)
- `as` — Transform function: `data → DOM`. Can be a function or a component reference
- Children — Synchronous initial content, rendered immediately, replaced when async delivers

**Shorthand:** `as={Component}` is equivalent to `as={data => <Component {...data} />}`

**Key behavior:** Channel creates **new DOM** each time a value arrives. The old DOM is discarded and replaced.

### Channel as function

The `channel()` function API is equivalent:

```jsx
const profileCard = channel(fetchProfile(), ProfileCard, { start: <Loading /> });
// Use in JSX: {profileCard}
```

Component syntax (`<Channel>`) is preferred when expressing layout inline, as it keeps the async orchestration visible in the template tree.

---

## Established: The Re-render Mechanism

The renderer can cache DOM nodes and replay bindings. This is the foundation for patterns that **update existing DOM** rather than replacing it.

### How it works (renderer.js)

1. On first render: template is cloned, binding points located via `querySelectorAll('[data-bind]')`, bind function created and cached in a WeakMap keyed by the root node
2. On re-render: existing node is pushed onto the injectable stack, render function runs again, `getBound()` finds the cached bind function, same bind function is called with new values
3. Result: same DOM nodes, new data applied. No DOM creation, no reconciliation.

### Controller and Updater (renderer.js)

**Controller** wraps a render function with two operations:
- `render(props)` — Normal path: creates new DOM
- `update(node, props)` — Re-render: pushes existing node onto injectable stack, re-runs render function, bindings replay on cached DOM

**Updater** extends Controller for the common single-node case:
- `render(props)` — Creates DOM, caches reference
- `update(props)` — Re-renders cached node (no need to pass node reference)

```javascript
// From controller.test.js
const updater = Updater.for(name => renderDOM(name));
const node = updater.render('felix');     // Creates <p>felix</p>
updater.update('duchess');                // Same <p>, now shows "duchess"
```

### Optimization note

Currently, the binding cache (WeakMap) stores bindings for every rendered node. For most use cases (render-once), this is unnecessary overhead. The caching could be made opt-in — only cache when a Controller/Updater is involved, since the Controller has privileged access to the renderer module.

---

## Speculative: Future Patterns

The following patterns are designed but not yet validated with real-world use. They await developer feedback and concrete use cases to refine their APIs.

### Render (component)

Like Channel, but uses the cached DOM + replayed bindings mechanism instead of creating new DOM each time.

```jsx
<Render async={statusStream} as={StatusPanel}>
    <span>Connecting...</span>
</Render>
```

**When Render earns its place over Channel:**
- Multi-value async sources where the template is structurally stable
- DOM preservation matters (scroll position, focus, animation state)
- Multiple bindings that all update together from the same data source
- High-frequency updates where DOM creation cost would add up

**When Channel is sufficient:**
- Promises (resolve once, DOM efficiency doesn't matter)
- Structural changes between updates (different component, different shape)
- Simple cases where the re-render machinery adds complexity without benefit

**Key insight from real-world use:** The Header component initially seemed like a Render case (h1 with name that arrives async). In practice, the name is a small piece of delayed content within a static structure — a Channel at the point of the name is simpler and correct. Render's value emerges with ongoing data streams, not one-shot promises.

### Act

Consume an async source and perform a side effect. No DOM output.

```jsx
<Act async={theme$} as={theme => document.documentElement.className = theme} />
```

Useful for cross-cutting concerns (theming, logging, analytics) that react to async data but don't produce layout.

### Update

Exposes explicit render/update lifecycle via objects with `render(data)` and `update(data)` methods. Not fully fleshed out — awaiting use cases.

### Naming considerations

| Pattern | Semantics | Status |
|---|---|---|
| **Channel** | Each value → new DOM replaces old | Established, in use |
| **Render** | First value → create DOM, subsequent → replay bindings | Designed, awaiting real-world validation |
| **Act** | Side effect, no DOM | Designed, simple enough to be confident |
| **Update** | Explicit render/update methods | Conceptual, needs use cases |

Alternative names considered: "Map" for Channel (too array-loaded), "Use" for Channel (too React-contaminated).

---

## Shared Async Sources

Promises can be shared safely — multiple `.then()` calls each receive the resolved value. This is why the Header can pass the same `async` prop to multiple Channels.

Multi-value sources (async generators, streams) are typically single-consumer. Sharing requires explicit fan-out via `tee` or `branch` helpers from Chronos.

---

## Design Principle

The component author chooses the appropriate async-to-DOM strategy for each piece of their layout. This is intentional — it requires understanding your data flows, but produces purpose-built solutions rather than one-size-fits-all state management.

When in doubt, start with Channel. It handles the common case (data arrives, DOM appears). Graduate to Render when Channel's replace semantics cause real problems.

---

*Derived from exploration on the wre-dashboards Header component, March 2026.*
