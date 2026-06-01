# Workflow

> This is the workflow that crystallized after a lot of dashboards. Not the
> first one I tried, and not the one I'd have predicted from the framework
> alone. It came out of repeated practice — designing, building, refactoring,
> watching where things broke — until a rhythm emerged that fit what Azoth
> actually is.
>
> The shape is UI-first. Static HTML and CSS lead. Components follow. Data
> shape gets derived backwards from what the View needs, not designed upfront
> from the API. A snapshot test pins the visual design before any plumbing is
> introduced, and stays as a regression net until structural tests can take
> over. Transforms sit between service shape and View props, so each layer can
> be tested independently. When the data is finally wired in, it lands into a
> View whose contract is already proven.
>
> I'm writing it down here because it's transferable. If you're building
> visualization-heavy UIs with Azoth and you want a known-good path through
> the work, this is mine.

## Philosophy: UI-First Development

Design visual assets first, then extract what needs to be data-driven.

**Why this works:**
- Non-technical stakeholders can verify screens directly
- Surfaces usability/suitability issues early
- Visual assets drive development
- "If screens look right to users, we're building the right thing"

---

## Workflow

### Phase 1: Static HTML Design

1. Write pure HTML/CSS with hardcoded sample data
2. Render → screenshot → visual inspection
3. Iterate until design is correct
4. Stakeholder review (they see real screens, not wireframes)

### Phase 2: Component Creation

After the static mockup is signed off, translate it into a real component.

1. **Create the component** — Translate the mockup directly into
   `Component.jsx` and `Component.css`. All values hardcoded. If you have a
   shared card-shell pattern (e.g. `<CardView>`), the View function returns
   the inner content; the card chrome is provided by the shell. Prefix CSS
   classes with the component name (`deals-*`, `income-*`, etc.) for
   namespace isolation.

2. **Pin with a snapshot test** — Instantiate the View with no props and
   snapshot its rendered HTML. This anchors the visual design as the source
   of truth — a regression net for everything that follows.

3. **Lift dynamic values to a module-level data object** — Define a
   `componentData` const at the top of the file holding every value that
   varies (text, percentages, formatted strings, computed SVG values).
   Replace literals in JSX with `{componentData.field}` interpolations. The
   snapshot must keep passing — proving the literals → const move changed
   the source, not the rendered HTML. This intermediate step is the safety
   rail: you confirm bindings work *before* introducing prop plumbing, and
   the `componentData` shape becomes the eventual View props shape.

4. **Resolve framework binding quirks as they appear** — If a dynamic value
   fails to land in the rendered HTML (snapshot diff shows missing
   attributes), use the appropriate workaround. For Azoth, SVG presentation
   attributes need `style={...}` template strings — see
   [Azoth-Specific Patterns](#azoth-specific-patterns) below and
   [attributes-and-properties](attributes-and-properties.md).

5. **Factor sub-components when patterns repeat** — Extract repeated
   structure into sub-components within the same file. Snapshot continues to
   anchor.

**Refactoring an existing component instead of creating new:** Same flow,
but step 1 is "pin the existing component's HTML before touching it" rather
than "translate from a sketch." The snapshot becomes a regression net for
the refactor.

### Phase 3: Service Shape & Transform

> **When this phase is needed:** Phase 3 applies when the View's prop shape
> differs from the service shape — formatting (e.g., dollar strings),
> computed values (e.g., percentages, dasharrays), or derived presentation
> fields. If the service shape is already what the View needs, skip the
> transform: the View destructures props directly, the `componentData` const
> is replaced by prop destructuring, and you proceed to Phase 4.

Design the service data shape and implement the transform that produces
View props from raw service data.

1. **Agree on the service shape** — In conversation, define the input data
   structure. Capture it in a markdown doc (e.g.,
   `src/services/<api>-requirements.md`) so the backend has a checklist. The
   shape is derived from what the View needs, not the other way around.

2. **Build domain rules modules if needed** — Non-trivial business logic
   (e.g., tier ladders, threshold checks) belongs in its own pure-function
   module (e.g., `tierRules.js`) with unit tests. Keep UI concerns out —
   these are pure data functions.

3. **Write the transform with TDD** — Create
   `Component.transform.test.js`. Write the *complete test suite up front*
   before implementing anything: the happy-path equality test
   (`serviceData` → `expectedOutput` matching your `componentData` const
   exactly), then every edge case you need the transform to handle (missing
   data, partial data, boundaries, conditional fields, formatter behavior at
   thresholds). Run; all tests fail. Implement `transformComponentData()`
   against the failing suite. Run; tests pass.

   The all-tests-up-front approach matters: it forces you to think through
   the data shapes and edge cases as a coherent specification before you
   touch implementation. Once you start coding, you're working against a
   fixed target, not discovering requirements piecemeal. The same applies
   to the variation tests in Phase 4.

4. **Wire the View to call the transform internally** — Change the View to
   accept service-shape props and call the transform inside:
   ```jsx
   export const ComponentView = ({ stats, goals, commission }) => {
       const { /* same fields as componentData */ } =
           transformComponentData({ stats, goals, commission });
       return ( /* JSX unchanged */ );
   };
   ```
   Remove the `componentData` const. Update the snapshot test to import
   `serviceData` from the transform test and spread into the View:
   `<ComponentView {...serviceData} />`. The rendered HTML is identical
   (transform output matches the prior const), so the snapshot still passes.

The View signature is the contract for the transform output. The transform
output is the contract for the service shape. Each is independently tested.

### Phase 4: Structural Tests

Once the transform is in place and the View is wired, the snapshot has done
its job. Replace it with focused structural tests.

1. **Core happy-path tests** — For each meaningful region of the View,
   assert the expected text and structure when fed the fixture service
   data. Use `querySelector` for targeted element checks; use
   `innerHTML.toContain(...)` for sanity checks on text presence. Cover
   what the snapshot was implicitly verifying with explicit assertions.

2. **Variation tests** — Cover behaviors that depend on data shape:
   - Missing or partial data
   - Edge values (capping at boundaries, zero/empty)
   - Conditional rendering (elements that disappear in some cases)
   - Conditional classes (modifier classes that toggle on/off)

   Each variation test should fail meaningfully if the View can't handle
   that case. When one fails, update the View with the conditional logic
   needed (e.g., `{cond && <Element />}` for hidden elements,
   `className={...}` for dynamic classes). Re-run; pass.

3. **Remove the snapshot** — Delete the snapshot test, the `.snap` file,
   and the `__snapshots__/` directory. The structural tests are now the
   regression net; the snapshot is now duplicated JSX.

Trade-off: structural tests cost more to write but give meaningful failure
messages. A failing test tells you which behavior changed, not just "HTML
differs."

### Phase 5: API Integration

The View is now driven by service-shape props. Connect to the actual API.

1. Add a fetch function in `src/services/<api>.js` that returns data in the
   agreed shape.
2. The async wrapper component passes the fetch promise to the View through
   a channel. If you use a shared `CardView` shell, an internal `AsyncView`
   resolves the promise and spreads the data into the View as props. The
   raw mechanic is the same: a channel feeds an async value into the JSX
   slot. See [async-and-channels](async-and-channels.md).
3. Verify with real data; handle the empty/loading/error states the shell
   supports.

---

## The Backwards Data Flow

A key insight: the data structure is *derived* from the UI, not the other
way around.

**Traditional approach:** Define API → Build components → Hope UI works

**UI-first approach:** Design UI → Extract data shape → Push backwards to
API/database

This creates a natural validation chain:
1. Static UI works visually
2. Component with props renders same output
3. External data produces same output
4. API data produces same output

Each step has a clear validation point: *does it still render correctly?*

**This technique extends all the way to the database.** If you know the UI
needs `{ name, market, goals: [...] }`, you can design your schema and
queries to produce exactly that shape. The UI becomes the specification.

---

## The Transformation Layer

When externalizing data, ask: **what should the service provide vs. what
should the component calculate?**

### Three layers

| Layer                   | Example                        | Where it lives               |
| ----------------------- | ------------------------------ | ---------------------------- |
| **Service data**        | `{ order, label, count }`      | Data files / API             |
| **Transform function**  | `transformFunnelData()`        | Component (exported, tested) |
| **Presentation config** | `funnelStandards` (thresholds) | Component                    |

### The pattern

1. **Define service shape** — minimal data the API would actually send
2. **Define presentation config** — thresholds, display rules, business
   logic
3. **Write transform function** — service data + config → props the
   component needs
4. **Test transform independently** — input/output verified before wiring
   to component
5. **Wire to component** — import data, call transform, render

### Why this matters

- Service data is stable (doesn't change when display rules change)
- Transform function is testable in isolation
- Presentation config can be adjusted without touching the API
- Each layer has a single responsibility

### Explore → Realize in transformation work

**Defining the service shape is exploration.** It requires:
- Dialogue about domain constraints
- Understanding what the API can/will provide
- Deciding what belongs in service data vs. component calculation
- Iterating on the input format through conversation

This exploratory work is what enables smooth realization when implementing
the transform.

**Implementing the transform is realization.** Once the input shape is
agreed:
- Write tests with expected output
- Implement the function
- Wire to component
- Validate via tests

The pattern: *collaborate to define the shape, then execute to achieve it.*

### How to write a transform (TDD recipe)

Transforms follow test-driven development. The test file becomes your
specification.

**Step 1: Create the test file with input/output sections**

```js
// __tests__/MyComponent.transform.test.js
import { describe, test, expect } from 'vitest';
import { transformMyData } from '../src/components/MyComponent.jsx';

// === INPUT DATA (service shape) ===

const serviceData = {
    // Sample data matching what the API will send
    items: [
        { id: 1, name: 'First', value: 100 },
        { id: 2, name: 'Second', value: 200 },
    ],
};

// === EXPECTED OUTPUT (component shape) ===

const expectedOutput = {
    // What the component needs to render
    rows: [
        { label: 'First', percent: 33, formatted: '$100' },
        { label: 'Second', percent: 67, formatted: '$200' },
    ],
    total: '$300',
};

// === TESTS ===

describe('MyComponent transformation', () => {
    test('transforms service data to component format', () => {
        const result = transformMyData(serviceData);
        expect(result).toEqual(expectedOutput);
    });

    // Additional tests for specific behaviors...
});
```

**Step 2: Run test (it fails — transform doesn't exist)**

**Step 3: Implement the transform in the component file**

```js
// src/components/MyComponent.jsx
export function transformMyData(serviceData) {
    // Implementation to make tests pass
}
```

**Step 4: Run test until green**

**Step 5: Wire transform to component**

```jsx
// The View accepts service-shape props and runs the transform internally.
export const MyComponentView = ({ stats, goals, /* etc. */ }) => {
    const { rows, total /* whatever the View needs */ } =
        transformMyData({ stats, goals });
    return (
        // pure presentation using transformed data
    );
};

// The async wrapper resolves the promise through a channel and spreads
// the data into the View as props. If you have a shared card shell, this
// is what `CardView` does internally.
export const MyComponent = ({ id, async, analysis }) => (
    <CardView
        id={id}
        class="my-component"
        title="..."
        async={async}
        Component={MyComponentView}
        loadingHeight="14em"
        analysis={analysis}
    />
);
```

In tests, you can pass the transform fixture directly to the View:
```js
import { serviceData } from './MyComponent.transform.test.js';
// ...
<MyComponentView {...serviceData} />
```

**Key insight:** The test file is the specification. Writing input/output
examples forces you to think through the data shapes before coding.

### Transform output: render-ready vs semantic

Two valid approaches to what the transform produces:

**Semantic output** — transform produces raw values; view computes
presentation:
```js
// Transform output
{ current: 7, goal: 12 }

// View computes
const dashArray = `${current/goal * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
```

**Render-ready output** — transform produces presentation strings:
```js
// Transform output
{ current: '7/12', dashArray: '165 283' }

// View just renders
<span>{tier.current}</span>
```

For dashboard cards (single-purpose, single-view) we've found render-ready
output works well:
- The View becomes pure "render strings" — easy to scan, easy to test
- The transform owns all formatting decisions — easy to change in one
  place
- Constants (e.g., SVG `CIRCUMFERENCE`) live in the transform, not
  duplicated
- Testing transform output captures the rendering spec exactly
- Some Azoth bindings (SVG presentation attributes) require pre-formatted
  strings via `style={...}` anyway — see
  [attributes-and-properties](attributes-and-properties.md)

Choose semantic output when the same transformed data feeds multiple views,
or when the View has presentation logic that varies independently. For
most dashboard components, render-ready is simpler.

### Example: a funnel transform

```js
// Service data (from API)
const data = [
    { order: 1, label: 'Connections', count: 26 },
    { order: 2, label: 'Pickups', count: 22 },
    // ...
];

// Presentation config (component owns)
const funnelStandards = {
    'Pickups': { goodRate: 0.85, warnRate: 0.70 },
    // ...
};

// Transform (tested independently)
const stages = transformFunnelData(data, funnelStandards);
// → [{ label, count, widthPercent, rate, rateStatus }, ...]
```

---

## Step Size: The Art of Validation Frequency

When refactoring or building, *step size* is the amount of change between
validations.

### The trade-off

- **Steps too small:** Feels tedious, slow progress
- **Steps too large:** Risk breaking things with no clear rollback point

### Adjusting step size

Step size should correlate with **certainty**:

| Situation                      | Step Size | Why                        |
| ------------------------------ | --------- | -------------------------- |
| Well-understood transformation | Larger    | High confidence in outcome |
| New framework/tool behavior    | Smaller   | Unknown edge cases         |
| Multiple changes at once       | Smaller   | Harder to isolate failures |
| Clear validation available     | Larger    | Fast feedback if wrong     |

### When things go wrong

If a step fails and the cause isn't obvious:

1. **Revert to last known working state**
2. **Take a much smaller step** to isolate the issue
3. **Validate each micro-step** until you find the boundary

Example: when a jump from inline static data to mapped/computed values
breaks rendering, don't debug in the broken state. Revert to working code
and take incremental steps to find exactly where things diverge.

### For AI assistants

When errors occur, consider:
- Was this a large step with multiple changes?
- Is there ambiguity in how the framework/tool behaves?
- Would smaller steps have isolated the issue faster?

The goal isn't to always take small steps — it's to *match step size to
uncertainty*. When something unexpected happens, that's a signal to reduce
step size until the system behavior becomes clear again.

---

## Tooling: MCP Browser Tools

MCP browser tools provide a complete visual feedback loop:

1. **Write HTML/CSS** → save to local file
2. **Navigate** → `browser_navigate` to `file:///path/to/file.html`
3. **Screenshot** → `browser_take_screenshot` captures rendered output
4. **Analyze** → the LLM sees the image and can suggest improvements
5. **Iterate** → repeat until visualization is correct

**Benefits:**
- No external dependencies
- Integrated into AI workflow
- Fast iteration
- Works with local `file://` URLs
- AI can see and reason about visual results

---

## Design Exploration: Pure HTML vs Data-Driven

**Tension:** When exploring a new visualization design, there's a choice:

1. **Pure HTML** — materialize all values directly in markup
2. **Data-driven** — use arrays, maps, computed values

**For design exploration, pure HTML is lower friction:**
- Focus on *how it looks* rather than *how it computes*
- Easy to tweak values by eye
- No abstraction layers between intent and output
- Faster iteration on visual structure

**Data-driven is better for:**
- Production code with real data
- When design is settled and you're wiring transforms
- Reusable patterns across components

**The trap:** Developers naturally reach for data structures. This is
premature optimization during design exploration — it solves the wrong
problem.

**Step reset:** If you've gone past design exploration into transform
territory and realize you need to iterate on visuals, consider resetting
to pure HTML. The cost of flattening computed values back to markup is low
(especially for AI), and it removes friction from design iteration.

**Concession for deadlines:** If the visual is "good enough" and time is
short, it's acceptable to proceed with data-driven code and refine later.
Just recognize the trade-off.

---

## Azoth-Specific Patterns

### Conditional rendering

Azoth handles conditionals **inside JSX expressions**, but components must
always return a DOM element:

```js
// Conditional inside JSX expression — works
function SearchResults({ results }) {
    return (
        <ul class="search-results">
            {results && results.map(agent => <SearchResultItem agent={agent} />)}
        </ul>
    );
}

// Conditional in parent deciding whether to render child — works
function AgentSearch(props) {
    const results = props?.results;
    return (
        <div>
            {results && <SearchResults results={results} />}
        </div>
    );
}

// Component returning conditional — fails (must return DOM element)
function SearchResults({ results }) {
    return results && (        // Returns undefined when falsy!
        <ul>{results.map(/* ... */)}</ul>
    );
}
```

The key insight: `{condition && <element>}` works in JSX expression slots.
But a component function itself must return a DOM element, not `undefined`
or `null`.

### SVG presentation attributes

Azoth's dynamic bindings work via DOM property assignment. SVG presentation
attributes (`stroke`, `stroke-width`, `stroke-dasharray`,
`stroke-dashoffset`, `fill`, `transform`) don't have writable DOM
properties — they're read-only `SVGAnimated*` objects. Dynamic interpolation
drops the value silently:

```jsx
// Value drops silently — rendered HTML has no stroke-dasharray attribute
<circle stroke-dasharray={dashArray} />

// Use style template — `style.cssText` is writable
<circle style={`stroke-dasharray: ${dashArray}`} />
```

Browsers normalize the resulting CSS (`113 283` becomes `113, 283`) but
render identically.

**Static SVG attributes are fine** — literal values (no `{...}`
interpolation) go into the HTML template directly:

```jsx
// Static stroke and stroke-width — no binding needed
<circle stroke="#334d39" stroke-width="9" stroke-dasharray="283" />
```

**Inline colors, not CSS classes**, for SVG strokes/fills — html-to-image
(used for screenshot capture) doesn't always export CSS-styled SVG strokes
correctly. Set `stroke="#..."` directly on the element.

See [attributes-and-properties](attributes-and-properties.md) for the
underlying mechanics.

### Avoid JSX comments inside returned JSX

Don't use `{/* ... */}` JSX comments inside the JSX you return from a
component. Even purely descriptive comments between siblings can crash the
runtime with `TypeError: Cannot read properties of undefined (reading
'data')` when one of the surrounding siblings is a dynamic component
invocation. The exact cause is in Azoth's anchor positioning when comments
appear between dynamic and static children; the symptom is that the whole
component tree fails to render.

```jsx
// Crashes when <CommissionTier /> is the second child
<div>
    <div class="left">...</div>
    {/* Right side */}
    <CommissionTier tier={tier} />
</div>

// Same JSX without the comment renders fine
<div>
    <div class="left">...</div>
    <CommissionTier tier={tier} />
</div>
```

Use regular JS line comments (`//`) above the JSX statement, or extract the
section into a named sub-component if the intent isn't obvious. See
[known-limitations](known-limitations.md).

### Dynamic class names

Static classes use `class="..."` and go into the HTML template. Dynamic
classes need `className={...}` because they're set via DOM property
assignment, and `class` isn't a writable property:

```jsx
// Dynamic — uses className
<span className={`tier-current${maintaining ? ' tier-met' : ''}`}>
    {label}
</span>

// Static — uses class
<span class="tier-current tier-met">{label}</span>
```

The rendered HTML attribute is `class="..."` in both cases. See
[attributes-and-properties](attributes-and-properties.md).

### Props handling

Azoth JSX invocation always passes a props object:

| Invocation | props receives |
|------------|----------------|
| `<Component />` | `{}` (empty object) |
| `<Component foo={bar} />` | `{ foo: bar }` |
| `Component()` | `undefined` |
| `Component({ foo: bar })` | `{ foo: bar }` |

**Key insight:** JSX invocation always passes a props object, enabling safe
destructuring. Direct function calls pass `undefined`.

#### Use destructuring for components

```js
// Destructuring is safe - JSX always passes an object
const ProfileView = ({ name, market, profileUrl }) => (
    <div class="profile">{name}</div>
);

// Works even with no props: <Loading />
function Loading({ height }) {
    return (
        <div class="loading" style={height ? `min-height: ${height}` : ''}>
            ...
        </div>
    );
}

// Default values work as expected
function Channel({ async, as, loading }) {
    return channel(async, as, { start: loading });
}
```

#### Direct function calls need defensive coding

If you call a component as a regular function (rare), props is `undefined`:

```js
// Direct call bypasses JSX - props is undefined
Loading();  // Would fail with destructuring

// Use defensive coding only if supporting direct calls
function Utility(props) {
    const value = props?.value;
    // ...
}
```

See [components](components.md) for the full props contract.

---

## Component Design Principles

### Function syntax for components

Use **named function declarations** for presentation components:

```js
// Named function — visually distinct, anchors the eye
function SearchResults({ results }) {
    return (
        <ul class="search-results">
            {results.map(agent => <SearchResultItem agent={agent} />)}
        </ul>
    );
}

// Arrow function — blends into a sea of arrows
const SearchResults = ({ results }) => (
    <ul class="search-results">
        {results.map(agent => <SearchResultItem agent={agent} />)}
    </ul>
);
```

Arrow functions are fine for:
- Very short components (single expression)
- Helper functions (non-presentation)
- Inline callbacks

The visual distinction helps when scanning a file — you can quickly
identify where components are defined.

### Table-of-contents pattern

Structure component files so they read like a table of contents:

```js
// === PRIMARY EXPORT ===
export function AgentSearch() {
    return (
        <SearchBox />
        <SearchResults results={data} />
    );
}

// === COMPONENTS ===
function SearchBox() { /* ... */ }
function SearchResults({ results }) { /* ... */ }
function SearchResultItem({ agent }) { /* ... */ }

// === HELPERS ===
const getAvatarUrl = (name) => { /* ... */ };
```

The primary export at the top shows the content structure at a glance.
Details follow below.

### Similarity of scale

Components within a parent should be at similar levels of abstraction. When
scanning a component, you shouldn't have to stop and parse inline details.

```js
// Mixed scale — <a> details interrupt the scan
function LandingPage() {
    return (
        <LandingHeader />
        <main>
            <a href="/agent-dashboard.html" class="landing-btn">
                My Agent 360° Dashboard
            </a>
            <AgentSearch />
        </main>
    );
}

// Uniform scale — all children are components
function LandingPage() {
    return (
        <LandingHeader />
        <main>
            <MyDashboardLink />
            <AgentSearch />
        </main>
    );
}
```

Extract inline markup when it disrupts the reading flow, even if the
component is simple.

### Look for component similarity

When two places have similar presentation, they often share function too.
This is a signal to create a shared component.

**Example:** Avatar images with initials fallback appear in both
`AgentProfile` and `AgentSearch`. Rather than duplicate the fallback logic,
create a shared `Avatar` component.

Similarity in presentation often indicates:
- Shared data shape
- Shared behavior
- Opportunity for a reusable component

### Mode shifts in development

Development naturally moves through modes. Recognize when to shift:

| Mode            | Focus          | Activities                               |
| --------------- | -------------- | ---------------------------------------- |
| **Design**      | How it looks   | Pure HTML, screenshots, visual iteration |
| **Refinement**  | Code structure | Component extraction, factoring, naming  |
| **Integration** | Data flow      | API wiring, transforms, error handling   |

**Shifting back is okay.** If integration reveals a design issue, shift
back to design mode. The cost of mode-switching is low; the cost of forcing
through is high.

---

## Async Data Patterns

For the full async surface — promises, generators, channels — see
[async-and-channels](async-and-channels.md). This section covers the
specific patterns that come up in the workflow.

### The stream + channel pattern

For interactive data flows (like search), use a stream generator and a
channel:

```js
import { generator as stream } from 'azoth/chronos/generators';
import { Channel } from '../shared/Channel.jsx';

export function AgentSearch(props) {
    const search = props?.search ?? searchAgents;
    const [results$, push] = stream(q => q ? search(q) : []);

    return (
        <div class="search-section">
            <SearchBox onsearch={push} />
            <Channel async={results$} as={r => <SearchResults results={r} />} />
        </div>
    );
}
```

**How it works:**

| Piece               | Role                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| `stream(transform)` | Creates `[asyncIterator, push]` — push values in, transformed values come out |
| `push`              | Function to send values into the stream                                       |
| `results$`          | Async iterator that yields transformed results                                |
| `<Channel>`         | Subscribes to async data and renders with `as` function                       |
| `as={r => ...}`     | Maps data to component — you control the prop mapping                         |

**The data flow:**
1. User types → `SearchBox` calls `push(query)` (debounced)
2. Stream transform runs: `q => q ? search(q) : []`
3. Result yields on `results$`
4. Channel renders `<SearchResults results={r} />`

### Stream transform logic

The stream transform is where conditional data logic lives:

```js
// If query exists, search; otherwise return empty
const [results$, push] = stream(q => q ? search(q) : []);
```

This handles:
- Empty input → returns `[]` → results clear
- Non-empty input → calls `search(q)` → results display

Keep data logic in the stream, not scattered across components.

### Channel's `as` prop

Channel passes data directly to the `as` function — you decide how to map
it:

```jsx
// Array data — pass as prop
as={r => <SearchResults results={r} />}

// Object data — spread as props
as={data => <LandingPageView {...data} />}
```

This keeps Channel generic while giving consumers full control.

### Dependency injection for testing

Accept service functions as props with defaults:

```js
export function AgentSearch(props) {
    const search = props?.search ?? searchAgents;  // Default to real API
    const [results$, push] = stream(q => q ? search(q) : []);
    // ...
}
```

Tests can inject mocks:

```js
test('renders results after search', async () => {
    const mockSearch = vi.fn().mockResolvedValue([
        { id: 'rec1', name: 'Test Agent', market: 'Portland' }
    ]);

    const component = <AgentSearch search={mockSearch} />;
    // ... trigger search, verify results
});
```

Production code stays clean (`<AgentSearch />`); tests get full control.

---

## Service Layer Guidelines

### Return natural data shapes

Services should return data in its natural form:

```js
// Search returns array of results
export async function searchAgents(query) {
    return agents.filter(a => a.name.includes(query));
}

// User context returns object with properties
export async function fetchUserContext() {
    return { isAgent: true, canSearch: true, agentId: 'rec123' };
}

// Don't shape data for specific components
export async function searchAgents(query) {
    return { results: [/* ... */] };  // Component concern leaked into service
}
```

The mapping from data shape to component props happens at the integration
point (the `as` function), not in the service.

### Separation of concerns

| Layer             | Responsibility    | Example                                |
| ----------------- | ----------------- | -------------------------------------- |
| **Service**       | Fetch/filter data | `searchAgents(query)` returns `[...]`  |
| **Stream**        | Data flow logic   | `q => q ? search(q) : []`              |
| **Channel**       | Async rendering   | Subscribe and render when data arrives |
| **`as` function** | Prop mapping      | `r => <SearchResults results={r} />`   |

Each layer does one thing. When requirements change, you know where to
look.

---

## Linked Resources

External CSS files load correctly via relative paths:
- `<link rel="stylesheet" href="./styles.css">` works with `file://` URLs
- Images, fonts — any relative resource resolves from HTML file location

---

## See also

- [JSX as DOM](jsx-as-dom.md) — the foundation: JSX evaluates to real DOM
- [Components](components.md) — function and class forms, `component =
  constructor`, the View + CardView idiom
- [Composition](composition.md) — how `{…}` slots accept values
- [Async and Channels](async-and-channels.md) — promises, generators,
  channels
- [Attributes and properties](attributes-and-properties.md) — static vs
  dynamic; the `class` / `className` distinction; SVG attribute mechanics
- [Known limitations](known-limitations.md) — including the JSX-comment
  crash
- [Authoring style](authoring-style.md) — file naming, component
  organization
- [For LLMs](for-llms.md) — terminology discipline
- [`../MENTAL-MODEL.md`](../MENTAL-MODEL.md) — the origin document this
  site grew out of
