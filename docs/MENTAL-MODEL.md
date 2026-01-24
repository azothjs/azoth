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

### Philosophy: Filling Gaps, Not Building Abstractions

This is the core philosophical distinction that separates Azoth from other frameworks.

**The web platform is missing two things:**
1. **DOM literals in JavaScript** — no native syntax for `<p>hello</p>` yielding a DOM node
2. **Declarative templating** — no way to specify presentation AND data binding locations in one syntactic block

The platform has plenty of imperative DOM methods (`createElement`, `appendChild`, etc.), and even `<template>` tags for inert HTML. But there's no native way to get the expressiveness that templating provides — simultaneously specifying what to show AND where data goes.

**Azoth fills these gaps.** JSX becomes the literal syntax for interpolated HTML in JavaScript. That's it.

**Contrast with state management frameworks:** React, Vue, Svelte, etc. build **abstractions on top of** the web platform. They introduce:
- Virtual DOM or reactivity systems
- Component state separate from DOM state  
- Reconciliation/diffing layers
- Synthetic event systems

These abstractions create an **impedance mismatch** with how the web platform was designed to work. The browser is event-driven. The DOM is the source of truth. These frameworks fight that model.

**Azoth rejects this approach.** It's not that applications don't need state management — they do. But **state management is decoupled from the rendering library**. Azoth doesn't own your state. You bring your own patterns (observables, stores, signals, whatever) and Azoth consumes their async outputs.

**The contract is JavaScript.** Azoth understands synchronous and asynchronous JavaScript primitives — that's the integration surface. It shouldn't feel like a DSL. It's an integration layer between JavaScript data structures/objects/state libraries and the DOM. Any standard event delivery system should work. Discrete implementations exist for specific patterns, but the principle is: if it's a standard JavaScript async pattern, Azoth should handle it.

**Library vs Framework:** Philosophically, Azoth is a library extending the web platform. The developer experience feels like a framework (Vite, build artifacts, JSX syntax), but the mental model is: "I'm writing for the web platform, with some syntax sugar for templating."

### Interpolation: The Core JSX Concept

**Interpolation** is arguably the unifying concept in JSX. The `{...}` syntax creates slots where values flow in. Composition emerges from interpolation — it's how pieces combine.

#### Three Types of Interpolation

**1. Child Interpolation: `{value}` in content positions**

```jsx
<div>{content}</div>
<p>Hello, {name}!</p>
```

The `{...}` in child positions is a **general composition target** — not just for text display. Any value can go here: strings, numbers, DOM nodes, promises, async generators, arrays. Maya resolves whatever you provide into DOM.

**2. Attribute Interpolation: `{value}` in attribute positions**

```jsx
<div class={className} data-id={id}>
<input value={currentValue} disabled={isDisabled} />
```

Dynamic values flow into element attributes/properties. Static attributes go into the HTML template; dynamic ones become runtime property assignments.

**3. Component Interpolation: `<Component />`**

```jsx
<Parent>
  <Child name="value" />
</Parent>
```

Upper-case names signify components. Components are **interpolation points that accept props and produce DOM**. Props flow in, DOM comes out.

#### The Function Pattern

A common pattern combines all three:

```jsx
const Greeting = (name) => <p class="greeting">Hello, {name}!</p>;

// Usage
<div>{Greeting("world")}</div>
```

This is just JavaScript:
- A function takes parameters
- Returns JSX (which is DOM)
- Interpolation slots are filled from the parameters

**No magic here.** It's a function that returns DOM, called like any function. The JSX is the return value, the parameters fill the interpolation slots.

#### Interpolation vs Composition: The Distinction

**Interpolation** = what the Maya runtime does (resolving values to DOM)
**Composition** = how developers create building blocks from JSX

```jsx
const Card = (title, content) => (
  <div class="card">
    <h2>{title}</h2>         {/* ← interpolation point */}
    <div class="body">{content}</div>  {/* ← interpolation point */}
  </div>
);

const Page = () => (
  <main>
    {Card("Welcome", <p>Hello!</p>)}      {/* ← composition */}
    {Card("Info", <ul><li>Item</li></ul>)} {/* ← composition */}
  </main>
);
```

The `{...}` slots are interpolation points. Maya resolves them. Developers use them to compose larger structures from smaller pieces.

#### Answered Questions

**Q: How does this differ from React's interpolation?**

**ANSWERED:** Azoth extracts HTML at compile time and puts it in the HTML document. The browser's native HTML parser creates DOM — not JavaScript. 

Key mechanisms:
- Text interpolators become `<!--0-->` comment nodes (preserves child node structure)
- Elements with dynamic children get `data-bind` attributes
- Three generated functions: **targets** (locate nodes), **bind** (apply values), **renderer** (orchestrate)
- At runtime: clone template → locate targets via querySelectorAll → apply values → return DOM

No virtual DOM. No diffing. No reconciliation. Just: parse HTML → clone → bind → done.

See `packages/thoth/COMPILER.md` for full details.

**Q: Can attribute values be async?**
Properties are set to whatever value is provided — faithfully passed through. Async at the attribute level "unleashed chaos" in testing. The right level for async control is **above** attributes — the `renderer` with replay bindings is the better tool for re-applying values. Attribute-level is too low; async handling needs to happen at a higher abstraction.

**Q: Is `<Greeting name="world" />` different from `{Greeting("world")}`?**
Syntactically different:
- `<Greeting name="world" />` passes `{ name: "world" }` as props object
- `Greeting("world")` passes `"world"` as a string argument

But conceptually, no real difference — both produce DOM. Components aren't strictly *needed* (it's just JavaScript), but they provide good DX. Mixing intrinsic elements and components in a presentation block feels natural. Components also get some type handling benefits in how values flow through creation.

---

**Note on primitives as components:**

Azoth currently allows primitives to be passed as component values:

```jsx
const Cat = "bill";
<Cat />  // Writes "bill" to DOM
```

This is somewhat nonsensical — a string becomes text content, but what would properties mean on a string? The `create` function may attempt to set properties on whatever object is passed, but for primitives this gets weird.

Note: `<42 />` isn't valid JSX syntax. The issue is variable values, not literal syntax. When `const X = 42` and you write `<X />`, the number flows through creation.

**Future consideration:** Certain value types might be disallowed in component positions to catch likely errors. This is a potential API tightening.

### No Virtual DOM: A Subtraction, Not a Contrast

**Critical insight for LLMs:** Don't look for what "replaces" the virtual DOM. Nothing replaces it. Azoth never went there. The vDOM abstraction was never introduced, so there's nothing comparable.

This is a **subtraction**, not a contrast.

React introduced:
- Virtual DOM tree
- Reconciliation/diffing
- Component state management
- Synthetic event system
- Render cycle control

Azoth subtracted all of this. What remains is:
- HTML parsed by HTML parser
- Functions that clone and bind
- Self-executing artifacts
- Direct DOM access

**The artifacts are self-executing.** Maya interprets them, but there's no "engine" controlling things. No render cycle. No state synchronization. The generated functions contain the specific information they need — they just run.

**Opt-in vs Opt-out:**
- React: You must opt OUT of things (re-renders, state management, synthetic events)
- Azoth: You opt INTO things when you need them (renderer replay, blocks, etc.)

**Deduplication:** The decomposition enables smart reuse:
- Binding generators are deduped by structural pattern (same indexing = same function)
- HTML templates are deduped by content (many `<p>{x}</p>` expressions → one template)

**Performance note:** This architecture means more function calls (deeper stack) than frameworks like Svelte or Solid that compile to imperative code. At JS framework benchmark scale (thousands of items), this matters. For most applications, it doesn't. The architectural benefits outweigh micro-optimizations.

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
3. **DOM events** — any DOM event (user, browser, or programmatic)

**The events ARE the deltas.** Each event delivers a change instruction (Δ) to the current UI state.

DOM events are a major driver of this event-driven architecture. During initial (or subsequent) renders, event handlers get wired to DOM elements. These include:
- **User events:** click, input, keydown, scroll
- **Browser events:** resize, load, visibilitychange, online/offline
- **Programmatic events:** custom events, dispatchEvent

These handlers can:
- Dispatch new async actions (which deliver future deltas)
- Make synchronous changes directly (e.g., via observables)

The DOM events come from outside the Azoth boundary — they're just standard DOM event handling. But they integrate naturally because Azoth IS the DOM.

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

### Forward-Looking: Platform Alignment

Azoth's architecture anticipates where the web platform is heading.

**Observable proposal (TC39/WHATWG):**
There's ongoing work to add native Observable support to JavaScript/DOM, including methods like `EventTarget.prototype.on()` that would convert DOM events directly into Observable streams.

This aligns perfectly with Azoth's model:
- DOM events → async data structures → UI deltas
- No framework intermediary needed
- Native platform primitives for reactive patterns

Azoth was designed with async generators and similar patterns to avoid hard dependencies (like RxJS) while maintaining architectural compatibility with where the platform is heading. When/if Observables become native, Azoth's compose system is already designed to handle them.

*Note: Check current status of TC39/WHATWG Observable proposals for latest stage.*

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

`compose.js` is the heart of Maya's runtime. It contains both `compose` and `create` functions.

**Terminology clarification:**
- **Architectural "composition"** = the power of recursive tree building, breaking things into pieces that reassemble
- **Maya's `compose`** = specifically trying to interpolate a value into something DOM-renderable (maybe "interpolate" is a better word?)

**The resolution chain:** Compose evaluates values in a specific order:

| Test         | Target                                     | Action                               |
| ------------ | ------------------------------------------ | ------------------------------------ |
| value        | `undefined`, `null`, `true`, `false`, `''` | ignore/remove                        |
| type         | `string` or `number`                       | append as text                       |
| instance     | `Node`                                     | append                               |
| type         | `function`                                 | call, compose result                 |
| instance     | `Promise`                                  | .then(), compose resolved value      |
| value        | `Array.isArray`                            | map, compose each                    |
| **type**     | **`object`**                               | **check for async protocols...**     |
| has          | `[Symbol.asyncIterator]`                   | iterate, compose each yield          |
| instance     | `ReadableStream`                           | write (accumulates, doesn't replace) |
| has          | `.subscribe`                               | observe, compose emissions           |
| **no match** |                                            | throw                                |

This resolution chain means you can pass almost anything into a child interpolator and Azoth will figure out how to render it.

**`compose` vs `create`:**

Both are similar, but `create` is aware of:
- **Properties** being passed to the component
- **Slotable content** (named to evoke HTML `<slot>`, but not actually HTML slotable — it's DOM content that is NOT meant to be accessible the way React children are; more on this later)

**Top-level vs nested components:**

This distinction matters:

```jsx
// Nested: Component buried in intrinsic elements
<div><MyComponent /></div>
// Maya must run MyComponent through compose all the way to DOM

// Top-level: Component IS the JSX expression
const result = <MyComponent />;
// One level of creation, returns the result directly
```

When nested, Maya creates the component, then takes that output and keeps working with it through compose until it reaches DOM.

**Interesting use case — skinning/theming:**

```jsx
// First: create a component, get DOM back
const button = <StyledButton>Click me</StyledButton>;

// Later: use that DOM as a "component" in another JSX chunk
<ThemeWrapper theme="dark">{button}</ThemeWrapper>
// Properties passed here can be set on the top-level DOM element!
```

This enables patterns where you create DOM, then pass it through another compositional step that can modify its properties. Skinning, theming, decoration — all become possible through this mechanism.

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

### Layout Management, Not State Management

A reframing from hypermedia thinking: **the focus is on layout management instead of state management**.

```jsx
// State-driven thinking (React)
const [items, setItems] = useState([]);
useEffect(() => { fetchItems().then(setItems); }, []);
return <List items={items} />;

// Layout-driven thinking (Azoth)
return <div>{fetchItems().then(items => <List items={items}/>)}</div>;
```

In the layout-driven approach:
- We're not asking "what data do I need to store?"
- We're asking "what layout change happens when this data arrives?"
- The async data source IS the layout instruction
- Error handling happens in context (try/catch, .catch)

```jsx
// Error handling in layout context
async function loadList() {
    try {
        const items = await fetchItems();
        return <List items={items}/>;
    } catch(err) {
        return <Oops error={err}/>;
    }
}

return <div>{loadList()}</div>;
```

### State Management Integration: Channels (Chronos)

While Azoth doesn't own state management, there's a **state management integration layer** in the Chronos package that provides helpers for orchestrating changes.

**The `use()` function** — the primary channel API:

```jsx
const [CatCount, CatList] = use(fetchCats(), 
    cats => cats.length,                              // Transform 1: extract count
    [Cat, { map: true, startWith: <Loading/> }]       // Transform 2: map to components
);

return <>
    <header><h1>😸 <CatCount/> Cats</h1></header>
    <main><ul><CatList/></ul></main>
</>;
```

**What channels provide:**
- Connect async data sources to UI layout
- Transform data through multiple outputs
- Manage subscription lifecycles
- Orchestrate complex change patterns

**Supporting helpers:**
- `tee` — split an async source to multiple feeds
- `branch` — combine tee with per-feed transforms
- `act` — perform side effects from async sources (e.g., `act(theme$, t => html.className = t)`)

**The burden:** Without "just update state and everything re-renders," you must orchestrate the types of changes expected in your application. This is the hypermedia mindset — intentional change sets, not arbitrary state updates.

**Named pattern:** When working with async data in Azoth, **use the channel pattern**.

---

## Questions I Have

1. ~~**Updates:** When data changes, how does the DOM update?~~ **ANSWERED:** Updates come from async data structures firing events (promise resolution, generator yield, stream/observable emission). The transpiled code handles delivering the new HTML payload.

2. ~~**Bindings:**~~ **ANSWERED from tests:** If `name` is a primitive string, it's inserted once. If it's a Promise, the content appears when it resolves. If it's an async generator, each yield replaces the previous content. The "binding" is really just the async subscription.

3. **Components:** I know components exist but we haven't touched them. Are they functions? Classes? Something else?

4. **Slotable content vs React children:** You mentioned slotable content is "NOT meant to be accessible the way React children are." What does this mean practically? In React, `props.children` is a first-class thing components manipulate. Is Azoth's slotable content more opaque? Does the component just render it without introspecting it?

5. ~~**Fragments:**~~ **ANSWERED:** Nothing special. `<>...</>` returns a standard DocumentFragment. Thoth may collapse unnecessary fragments during compilation, but otherwise they work as expected per the DOM spec.

6. ~~**The runtime exports:**~~ **ANSWERED:** `compose` = resolve any value to DOM and insert at anchor. `createComponent` = instantiate a component and return result. `composeComponent` = instantiate and compose into an anchor. `renderer` = cache DOM + replay bindings for "UI = f(state)" sections.

7. **Channels relationship:** Is `use()` the primary channel API? How do `tee`, `branch`, and `act` relate to it? Are they alternatives or complementary?

8. **Delta taxonomy:** The hypermedia model talks about "well-known changes" and HTMX has "swaps" and "adds." Is there a formal taxonomy of delta types in Azoth? Or is it just replace/accumulate?

9. **Unsubscription:** How do channel subscriptions get cleaned up? Is it automatic when DOM is removed? Manual?

---

## Where My React Bias Might Be Showing

1. ~~**Thinking in re-renders:**~~ **REFRAMED:** The right question isn't "when does it re-render?" — Azoth is **event-driven**. Page load is the initial event. All subsequent DOM changes are caused by async activity set in motion. There's no render cycle, just events triggering DOM updates.

2. **Component lifecycle:** I assume there's mount/unmount behavior, but maybe DOM elements just... exist and get removed?

3. ~~**State management:**~~ **REFRAMED:** Nothing "manages state" in Azoth. State management is decoupled from rendering. You bring your own patterns (observables, stores, whatever) and Azoth consumes their async outputs through channels. The right framing: **layout management, not state management**.

4. ~~**Expecting a framework boundary:**~~ **CONFIRMED:** Azoth has no such boundary. There's no "inside Azoth" vs "escaping Azoth" — it's all just JavaScript and DOM. Use any web platform API directly.

5. **Terminology drift:** I might slip into React terminology. Watch for: "hooks" (use "channels"), "re-render" (use "delta/update"), "lifecycle" (there isn't one — DOM just exists), "state" (use "async data source").

---

## Inconsistencies I Notice In My Understanding

1. ~~I said "DOM is the state" but also there's a "binding mechanism"~~ **RESOLVED:** The compiled code sets up listeners for async sources. When they fire, the DOM gets updated. DOM is still the state — the bindings are just the plumbing that delivers updates.

2. Template extraction is "invisible to developers" but I keep mentioning it — should I stop thinking about it? *Probably yes for developer docs, but it's relevant for understanding compilation.*

3. ~~I'm unclear if Azoth is "no framework" or "minimal framework"~~ **CLARIFIED:** The transpiled code IS the runtime. Maya provides services that the transpiled code uses, but there's no framework layer you "go through." It's more like a library the compiled output calls.

---

*Last updated: Documentation review pass — added channels, layout management framing, compose evaluation table*

---

## Context Not Yet Captured

*Notes for LLM reboot - conversational knowledge not in this doc:*

### Testing Infrastructure
- Tests run in **Vitest browser mode** (real Chrome via webdriverio), not jsdom
- Inline snapshots with `/* HTML */` comment enable syntax highlighting
- `fixture()` helper pattern: clears body, appends node, returns innerHTML
- Tests written in `.tsx` for TypeScript checking despite Azoth being JS
- Type assertions (`as HTMLParagraphElement`) used since `JSX.Element = Node` is broad

### Build Pipeline for TSX
- Azoth's Thoth compiler (Acorn-based) can't parse TypeScript
- Solution: `esbuild.transform` strips TS types before Thoth processes JSX
- See `packages/vite-plugin/TSX-SUPPORT.md` for details

### Project Context
- This mental model doc is part of a **documentation strategy for AI adoption**
- Related project: `ai-era-innovation` repo, conference talk on AI + non-dominant frameworks
- The Azoth framework is being used for a **real estate agent dashboard** project
- Strategy doc: `ai-era-innovation/strategies/documentation-patterns.md`

### What This Doc Is For
- Iterative refinement of LLM understanding
- User corrects misconceptions, LLM updates doc
- Goal: reduce React pattern drift when generating Azoth code

### Scratchpad Documentation
- `azoth/docs/scratchpad/` contains rough but accurate docs on:
  - Channels and the `use()` API
  - JSX composition patterns and the full evaluation table
  - Async child composition with error handling
- These are candidates for cleanup once the mental model stabilizes

### Still Needs Deep Exploration
- The blocks system (keyed, anchored) for sophisticated list management
- Slotable content mechanics vs React children
- Component instantiation patterns (functions vs classes)
- Subscription cleanup and lifecycle

---

## Component Children (Slottable)

Azoth components can receive children, but the mechanism differs from React.

### Component Signature

```jsx
// Props as first arg, slottable (children) as second arg
const Card = ({ class: className }, slottable) => (
    <div class={`card${className ? ` ${className}` : ''}`}>
        {slottable}
    </div>
);
```

### Key Differences from React

1. **Second argument, not a prop:** Children are passed as the second argument to the component function, not as `props.children`.

2. **Called "slottable":** The convention is to name it `slottable` rather than `children` to emphasize the difference.

3. **You receive DOM, not virtual DOM:** In React, `children` are React elements you can manipulate (clone, map, filter). In Azoth, `slottable` is actual DOM content. Don't try to "muck about" with it — just render it.

4. **Composition, not manipulation:** Achieve the same patterns by composing components (nesting) rather than manipulating children programmatically.

### Usage

```jsx
// Definition
const Card = ({ class: className }, slottable) => (
    <div class={`card${className ? ` ${className}` : ''}`}>
        {slottable}
    </div>
);

// Usage - content becomes slottable
<Card class="stats">
    <h2 class="card-title">Title</h2>
    <div class="content">...</div>
</Card>
```

### Compiled Output

Looking at the compiler tests, component children compile to:

```javascript
// Input:
const c = <Component><p>content</p></Component>;

// Output:
const c = __rC(Component, null, templateFn());
//              ^Component  ^props  ^children template
```

The third argument to `__rC` is a template function that creates the DOM for the children.

### Testing and Development Environments

Azoth has several testing environments, each with a specific purpose:

**Valhalla (`packages/vahalla/`):**
- Browser-based tests via Vitest browser mode + Chrome
- Tests the **developer-facing JSX API** at the integration level
- Use for component patterns, rendering behavior, JSX-to-DOM verification
- Add tests here when investigating bugs at the API level

**vite-test (`vite-test/`):**
- A minimal Vite bootstrap project
- Verifies that Azoth works correctly in a standard Vite build environment
- **Build system integration test** — does Azoth + Vite produce a working app?
- Keep minimal; it's not a test suite, it's a smoke test for the build

**Thoth compiler tests (`packages/thoth/compiler.test.js`):**
- Tests the compiler/transpiler output directly
- Use for testing compilation behavior, generated code, template structure
- Add tests here for parser/transpiler-level issues

**Happy-dom vs real browsers:** When encountering errors in Node-based test environments (like happy-dom), verify the pattern works in a real browser first. Some DOM behaviors differ between implementations.

### See Also

- `packages/vahalla/components.test.tsx` — API-level tests for component patterns
- `packages/vahalla/README.md` — Testing conventions and inline snapshot format
- `packages/thoth/compiler.test.js` — "component child templates" and "compose component" tests
- `packages/thoth/transform/Analyzer.js` — How children are analyzed
- `packages/thoth/transform/Transpiler.js` — How children are transpiled

---

## Known Issues

*Bugs and unexpected behaviors discovered during development:*

### JSX Comments Render as "1" Text Nodes

**Issue:** Commented-out JSX components using `{/* <Component /> */}` syntax cause spurious "1" text nodes to appear in the DOM between sibling elements.

**Reproduction:**
```jsx
<main>
    <Header />
    {/* <OldComponent /> */}
    <NewComponent />
</main>
```
Results in a "1" text node appearing between `<Header>` and `<NewComponent>` in the rendered DOM.

**Workaround:** Remove commented-out JSX entirely rather than leaving it in place. Use version control to preserve old code instead of inline comments.

**Status:** Open — likely related to how Thoth compiles JSX comments or how Maya's anchor system handles empty interpolation slots.

### Boolean Props Without Values (Fixed)

**Issue:** Using boolean props without explicit values on custom components caused Thoth to error with `Cannot read properties of null (reading 'type')` in `Transpiler.ComponentProps`.

**Reproduction:**
```jsx
// This now works:
<MyComponent flag />

// Equivalent to:
<MyComponent flag={true} />
```

**Root Cause:** In `Analyzer.JSXAttributes`, when processing component props (where `jsxOnly=false`), attributes without values had `expr=null`. The code didn't handle this case before passing to `Transpiler.ComponentProps`, which crashed when accessing `expr.type`.

**Fix:** In `Analyzer.js`, when `expr` is null for component props, create a synthetic boolean literal:
```javascript
// Boolean shorthand: <Component flag /> means flag={true}
if(!jsxOnly && expr === null) {
    expr = { type: 'Literal', value: true };
}
```

**Note:** This only affected custom components. Native HTML elements already handled boolean attributes normally via a different code path (`jsxOnly=true` skips non-expression attributes).

**Status:** Fixed — Boolean shorthand now works like JSX/React.

**Context:** Discovered while refactoring `FubClientsStage.jsx` where `<FubSimpleRow muted />` caused the error.

### Dynamic Bindings Require DOM Property Names (Not Attribute Names)

**Issue:** Dynamic attribute bindings use DOM property assignment, not `setAttribute()`. This means you must use the DOM property name (`className`) rather than the HTML attribute name (`class`).

**Root Cause:** In `makeBind()` (template-generators.js), dynamic values are assigned directly to DOM properties:
```javascript
t0.className = v0;  // Works - className is a DOM property
t0["class"] = v0;   // Fails - "class" is not a valid DOM property
```

**Reproduction:**
```jsx
// Static attribute — WORKS (goes into HTML template directly)
<div class="card">content</div>
// Output: <div class="card">content</div>

// Dynamic with attribute name — BROKEN
<div class={myClass}>content</div>
// Output: <div>content</div>  ← class missing!

// Dynamic with property name — WORKS
<div className={myClass}>content</div>
// Output: <div class="highlighted">content</div>
```

**Common attribute → property mappings:**
- `class` → `className`
- `for` → `htmlFor`
- `readonly` → `readOnly`
- `tabindex` → `tabIndex`

**Documented behavior:** See line ~359: "Attributes need attribute names, properties need DOM property names."

**Future work:** A translation layer could allow developers to use either name interchangeably (90% complete in separate project).

**Workaround:** Use `className` for dynamic class bindings, `class` for static.

**Status:** Known limitation — documented, workaround available. Future: attribute-to-property translation layer.

### Component with Dynamic Binding Inside Slottable (Under Investigation)

**Issue:** A component with dynamic bindings (e.g., `{title}`) used inside another component's slottable crashes at runtime.

**Reproduction:**
```jsx
const CardTitle = ({ title }) => (
    <h2 class="card-title">{title}</h2>
);

const Card = (props, slottable) => (
    <div class="card">{slottable}</div>
);

// This crashes:
<Card>
    <CardTitle title="Performance Stats" />
</Card>
```

**Error:** `TypeError: Cannot read properties of undefined (reading 'data')` at compose.js line 201 in `clear(anchor)` function.

**Observations:**
- Works: Same pattern in Valhalla tests (components defined inline in same file)
- Fails: wre-dashboards (components imported from separate file)

**Under investigation:** Need to isolate the variable (inline vs imported) with controlled experiment in Valhalla.

**Workaround:** Use imperative DOM manipulation:
```jsx
export const CardTitle = ({ title }) => {
    const h2 = <h2 class="card-title"></h2>;
    h2.textContent = title;
    return h2;
};
```

**Status:** Open — root cause unknown, investigating.