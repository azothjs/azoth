# My Mental Model of Azoth

*A document where I (the LLM) make explicit my understanding of Azoth, for review and correction.*

---

## What I Believe I Understand

### JSX → DOM Literals

When I write `<p>hello</p>` in Azoth, the expression evaluates to an actual `HTMLParagraphElement`. This is not a description or instruction — it's the real DOM node, ready to use.

**Contrast with React:** React JSX returns a plain object (`{ type: 'p', props: {...} }`) that describes what to render. A reconciler later creates/updates actual DOM.

**Implication:** I can immediately use DOM APIs on JSX output:
```jsx
const list = <ul><li>one</li><li>two</li></ul>;
const items = [...list.children];  // Works immediately
list.querySelector('li').classList.add('first');  // Standard DOM
```

### No Framework Layer To Go Through

This is critical: React returns plain objects because **rendering must happen within React's infrastructure**. React needs to control the process so it knows what's going on. All changes and activity must go through the React framework.

In Azoth, **the compiled/transpiled code IS the runtime**. There's no framework layer mediating between your code and the DOM. The JSX compiles to code that directly creates and returns actual DOM objects. You authored JSX, you get DOM.

**Contrast:** React owns the render cycle. Azoth gets out of your way.

### Just JavaScript, Just DOM

The "binding" in Azoth is really just **async subscription** — it's just JavaScript.

This seems counterintuitive after years of state-driven frameworks, but Azoth lets you think in:
- **JavaScript** — normal values, functions, async patterns
- **DOM** — the actual web platform API
- **Web platform primitives** — no proprietary abstractions

**The API around JSX is the DOM:**
- Outputs are DOM nodes
- Inputs are DOM nodes, JS values, or JS async data structures
- Everything can be reasoned about as normal JavaScript

**No boundary** between Azoth and any web platform technology. Use any browser API, any DOM method, any JavaScript pattern — they all just work.

**Contrast with other frameworks:** Even SolidJS has quirky non-standard JavaScript behavior arising from transpilation rules. Azoth avoids this by keeping the abstraction layer minimal and aligned with the platform.

### No Virtual DOM, No Reconciliation

Azoth doesn't maintain a shadow tree to diff against. The DOM I create IS the state. This is consistent with the original vision for HTML in the browser — the DOM is the source of truth.

**Contrast with React:** React diffs virtual trees and batches updates. You work with state, React syncs to DOM.

### Updates Come From Async Data Structures

Azoth accepts asynchronous data structures in JSX child expressions:
- Promises
- Async generators  
- Web streams
- Observables

When these async sources fire (promise resolves, generator yields, stream emits, observable fires), a new HTML payload gets delivered through the transpiled runtime code.

**Concrete example from tests:**
```jsx
async function* Items() {
    yield <p>Loading...</p>;           // DOM shows: <p>Loading...</p>
    yield <ul><li>one</li></ul>;       // DOM shows: <ul>... (replaces previous)
    yield <ul><li>one</li><li>two</li></ul>; // DOM shows: updated list
}

// In JSX: <div>{Items()}</div>
```

Each yield delivers **JSX** (DOM), not just values. The DOM starts with a comment anchor (`<!--0-->`), then each yield **replaces** the previous content. It's not value interpolation — it's DOM replacement.

**The model:** Changes to the UI happen as change instructions over time. This is hypermedia thinking — similar to what HTMX talks about, but more comprehensive and client-side rather than server-oriented.

### The Fundamental Model: Events = Deltas

This is the core of Azoth's architecture. The **event-driven** view and the **hypermedia** view are the same thing:

```
ui₀ = initial render (page load event)
ui₁ = ui₀ + Δ (promise resolved)
ui₂ = ui₁ + Δ (generator yielded)
ui₃ = ui₂ + Δ (stream emitted)
ui₄ = ui₃ + Δ (user clicked button)
...
uiₙ = uiₙ₋₁ + Δ (any event)
```

**Event sources:**
1. **Page load** — initial render
2. **Async data structures** — promises, generators, streams, observables firing
3. **DOM user events** — clicks, inputs, etc. wired up during render

**The events ARE the deltas.** Each event delivers a change instruction (Δ) to the current UI state.

DOM user events are a major driver of this event-driven architecture. During initial (or subsequent) renders, event handlers get wired to DOM elements. These handlers can:
- Dispatch new async actions (which deliver future deltas)
- Make synchronous changes directly (e.g., via observables)

The DOM events themselves come from outside the Azoth boundary — they're just standard DOM event handling. But they integrate naturally because Azoth IS the DOM.

- No full re-render
- No virtual DOM diffing
- Just incremental change instructions applied directly to the DOM

The DOM is the app state. The UI evolves through a sequence of deltas, each triggered by an event.

### Alignment with the Original Web Platform

This event-driven, delta-based model isn't novel — **it's how the browser was designed to work from the beginning**.

The web platform has always been event-driven:
- DOM events fire directly on elements
- Event handlers trigger changes
- The DOM is the source of truth

React and similar frameworks introduced an **abstraction layer** on top of this:
- Virtual DOM as an intermediary
- Synthetic events wrapping native events
- Component state separate from DOM state
- Reconciliation to sync the two

**Azoth rejects this abstraction as an impedance mismatch.** The virtual DOM model adds:
- Complexity (diffing, reconciliation, batching)
- Overhead (memory, CPU for virtual tree operations)
- Cognitive load (reasoning about two states: component state AND DOM state)
- Boundary friction (escaping the framework to use platform APIs)

By working directly with the DOM, Azoth aligns with:
- The browser's native event loop
- Direct DOM manipulation APIs
- The original vision of HTML as a living document

**This is a return to fundamentals**, not a step backward. Modern browsers are highly optimized for direct DOM operations. The abstractions that made sense in 2013 (cross-browser inconsistencies, performance workarounds) are less necessary today.

### Azoth as "Missing Browser Pieces"

A design philosophy: Azoth fills gaps in the web platform, not replaces it.

**What the browser is missing:**
1. **DOM literals in JavaScript** — no native syntax for `<p>hello</p>` yielding a DOM node
2. **Async → DOM integration** — no simple way to pipe async data structures into DOM rendering

Azoth provides exactly these two things. Nothing more.

*Tongue-in-cheek:* Azoth is a suggestion for rounding out the web platform. It takes the **one good idea from React** (JSX as a declarative DOM syntax) and integrates it with the platform rather than building a parallel universe on top of it.

JSX without the baggage. Async without the complexity. DOM without the abstraction.

### HTML Attributes vs DOM Properties

The distinction is about **static vs dynamic**:

- **Static attribute value** (no interpolation) → compiled into the HTML template
- **Dynamic value** (JSX interpolation `{...}`) → DOM property assignment at runtime

```jsx
// Static: becomes HTML attribute in template
<input name="title" required />

// Dynamic: becomes property assignment at runtime
<input value={title} />
```

**Current state:** Attributes need attribute names, properties need DOM property names. Future work: translation layer so developers can use either interchangeably.

**Interesting pattern:** You can use BOTH on the same element — static attribute for initial HTML (no flash of unstyled content), plus dynamic property for runtime updates.

**Contrast with React:** React requires `className`/`htmlFor` not because of "programmatic setting" but because React's JSX transpiles to JavaScript where `class` and `for` are reserved keywords. Azoth doesn't need this guard because static attributes go directly to HTML templates, never touching JS runtime as property names.

### Thoth and Maya

- **Thoth** = Compiler. Transforms JSX into templates + binding code.
- **Maya** = Runtime. Provides composition and rendering services.

### Core Insight: DOM Changes Are Limited

From years of DOM research (including co-maintaining RactiveJS with Rich Harris before Svelte), a key observation: **there are really only two types of DOM changes:**

1. Change attributes/properties on elements
2. Manage 0-to-n lists of nodes

Everything else is derived from these primitives.

### Maya's Architecture Layers

Maya provides **opt-in levels of sophistication**. React-like concepts exist but you opt INTO them.

These are **compositional building blocks** for state management:

| Layer        | Purpose                                                        | Complexity |
| ------------ | -------------------------------------------------------------- | ---------- |
| **compose**  | Value integration, initial render, streaming                   | Simplest   |
| **replace**  | Swap content at anchor                                         | Simple     |
| **blocks**   | Replicated templates, list operations (add/remove/update rows) | Medium     |
| **renderer** | Cache DOM, replay bindings, "UI = f(state)" for a section      | Advanced   |

You combine these as needed for your state management approach.

### Maya's Compose Engine

`compose.js` is the heart of Maya's runtime. It's a **set of rules for any type of value** that resolves inputs to DOM output.

**The resolution chain:** If compose needs a DOM result, it keeps deriving:
- Function? Call it, compose the result
- Class? Instantiate it, compose the result  
- Promise? Wait for it, compose the resolved value
- Async iterator? Subscribe, compose each yielded value
- Array? Compose each element
- Node? Insert it
- String/number? Create text node

**`compose` vs `create`:**
- `create` = for Component syntax in JSX (class/function components)
- If top-level JSX is a Component, it creates once and returns the result
- If a Component is inside a larger JSX snippet with intrinsic elements, it must fully resolve to DOM via compose

**Replace vs Accumulate:**
- Default behavior: new values **replace** previous content
- Exception: `ReadableStream` **adds** items (accumulates)

**The anchor mechanism:**
- Comment nodes (`<!--0-->`) serve as positional anchors
- `anchor.data` tracks how many nodes were inserted
- `clear(anchor)` removes previous nodes before replacement
- `replace(anchor, input)` inserts before anchor and increments count

### Blocks (List Management)

The `blocks/` folder contains anchored blocks, keyed blocks, etc. — strategies for managing lists of nodes with specific operations:
- Add rows
- Remove rows  
- Update rows
- Different keying strategies

This is where you opt into more sophisticated list handling when needed.

### SyncAsync: Initial Value + Async Data Structure

A critical pattern: provide a **synchronous value** for immediate composition, plus an **async data structure** for future values.

```jsx
SyncAsync.from(
    <p>Loading...</p>,           // Value: composed immediately (sync)
    fetchData().then(data => <Results data={data} />)  // Async data structure: delivers future replacements
)
```

**The distinction:**
- First argument: a **value** to compose directly (sync)
- Second argument: an **async data structure** (Promise, generator, stream, observable) for future values

**Why this matters:**
- Many frameworks have async/sync tension (React is mostly async with sync opt-ins)
- High UI/UX work often needs synchronous behavior
- Azoth's library mentality: render sync NOW, follow up with async later
- This is the hypermedia "swap" pattern

**SDK naming:** Current naming (`SyncAsync`) needs improvement — a future refactoring target.

**Future potential:** Compose could accept custom signals for behaviors beyond just replace/add — developer-controlled rendering behavior.

### Renderer (Cached DOM + Replay)

The renderer can **cache DOM nodes and replay bindings**. This is opting into "UI = f(state)" but for a **section** of DOM, not the whole app.

**How it works:** Literally reuses the **same binding function** that applied initial values. No reconciliation process — just re-running the bindings on the cached DOM structure.

**Limitations (by design):**
- Meant for sections of DOM with data updates
- Not for heavy recomposition of DOM blocks
- Must reliably rebind to the initial DOM structure

**Inverse of React's limitation:**
- React: must keep `useState` calls in same order (invocation counting for consistency)
- Azoth: must reliably rebind to initial DOM structure created on first render

Different tradeoffs for different models.

**Key distinction from traditional frameworks:**
- Traditional frameworks = "spreadsheet editors" — any CRUD anywhere, framework manages all state ubiquitously
- Azoth = DOM is state, you **choose** the appropriate strategy for each piece of functionality

You pick the state management approach that fits your use case, rather than having one imposed globally.

### Intentional Data Flow Design

A consequence of Azoth's architecture: **you must understand your application's data flows**.

In generic state management frameworks, you do state management the same way everywhere. In Azoth, you need to think about:
- How will this part of the application be used?
- How does data flow through it?
- What types of changes are expected?
- How should changes be applied?

**This is intentional.** Solutions emerge that are:
- Well thought out
- Appropriate for how they're being used
- Specific to the problem at hand

This requires more upfront thinking but produces more efficient, purpose-built solutions rather than one-size-fits-all approaches.

---

## Questions I Have

1. ~~**Updates:** When data changes, how does the DOM update?~~ **ANSWERED:** Updates come from async data structures firing events (promise resolution, generator yield, stream/observable emission). The transpiled code handles delivering the new HTML payload.

2. ~~**Bindings:**~~ **ANSWERED from tests:** If `name` is a primitive string, it's inserted once. If it's a Promise, the content appears when it resolves. If it's an async generator, each yield replaces the previous content. The "binding" is really just the async subscription.

3. **Components:** I know components exist but we haven't touched them. Are they functions? Classes? Something else?

4. ~~**Fragments:**~~ **ANSWERED:** Nothing special. `<>...</>` returns a standard DocumentFragment. Thoth may collapse unnecessary fragments during compilation, but otherwise they work as expected per the DOM spec.

5. ~~**The runtime exports:**~~ **ANSWERED:** `compose` = resolve any value to DOM and insert at anchor. `createComponent` = instantiate a component and return result. `composeComponent` = instantiate and compose into an anchor. `renderer` = cache DOM + replay bindings for "UI = f(state)" sections.

---

## Where My React Bias Might Be Showing

1. ~~**Thinking in re-renders:**~~ **REFRAMED:** The right question isn't "when does it re-render?" — Azoth is **event-driven**. Page load is the initial event. All subsequent DOM changes are caused by async activity set in motion. There's no render cycle, just events triggering DOM updates.

2. **Component lifecycle:** I assume there's mount/unmount behavior, but maybe DOM elements just... exist and get removed?

3. **State management:** I assume something manages state, but you said there's "no direct tie to state management" — just primitives and async constructs.

4. ~~**Expecting a framework boundary:**~~ **CONFIRMED:** Azoth has no such boundary. There's no "inside Azoth" vs "escaping Azoth" — it's all just JavaScript and DOM. Use any web platform API directly.

---

## Inconsistencies I Notice In My Understanding

1. ~~I said "DOM is the state" but also there's a "binding mechanism"~~ **RESOLVED:** The compiled code sets up listeners for async sources. When they fire, the DOM gets updated. DOM is still the state — the bindings are just the plumbing that delivers updates.

2. Template extraction is "invisible to developers" but I keep mentioning it — should I stop thinking about it? *Probably yes for developer docs, but it's relevant for understanding compilation.*

3. ~~I'm unclear if Azoth is "no framework" or "minimal framework"~~ **CLARIFIED:** The transpiled code IS the runtime. Maya provides services that the transpiled code uses, but there's no framework layer you "go through." It's more like a library the compiled output calls.

---

*Last updated: Based on smoke.test.tsx work and pivot-feasibility planning*
