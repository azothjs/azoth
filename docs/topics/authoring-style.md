# Authoring Style

> Azoth gives you very little ceremony. There's no router, no state container,
> no opinion about where the data layer lives. That's the appeal — but it
> means **convention does more work than the framework can**. When the tool
> isn't telling you "components go here, state goes there," you have to be
> intentional about naming, file structure, and design choices, or the
> codebase quietly drifts.
>
> What follows is the set of conventions that emerged from production use,
> primarily in the wre-dashboards app. None of them are enforced by Azoth.
> All of them paid for themselves.

## File naming

Two conventions, visually distinct:

- **PascalCase** for component files: `Card.jsx`, `AgentDashboard.jsx`,
  `AnalysisChat.jsx`.
- **lowercase-kebab-case** for entry files (the mount points):
  `home-main.jsx`, `agent-dashboard-main.jsx`.

The visual distinction is intentional:

- PascalCase = **exports a component**. Importing it does nothing; you have
  to instantiate it.
- lowercase-kebab = **runs side effects on import**. The file mounts the
  app. There's nothing to export.

If a file's name doesn't fit either bucket, that's a signal it's doing
something it shouldn't.

## Module-level side effects in `*.jsx` are a red flag

Components export. Entry files mount. That's the split.

Because Azoth JSX executes inline — `<Foo />` is a real DOM construction at
the expression site, not a description handed to a renderer — accidentally
evaluating JSX at module load can be a bug. The element gets built, then
either leaks (never attached) or attaches itself somewhere unintended.

```jsx
// Foo.jsx — red flag
document.body.append(<Foo />);     // side effect at import time
export const Foo = () => <div>…</div>;

// foo-main.jsx — the right home for the mount
import { Foo } from './Foo.jsx';
document.body.append(<Foo />);
```

The naming makes the side-effect boundary visible to a reader scanning the
file tree. See [jsx-as-dom](jsx-as-dom.md) for why this matters at the
language level.

## Component folder shape

A typical folder, as it crystallized in wre-dashboards:

```
AgentDashboard/
  AgentDashboard.jsx          (the component, default-exported)
  AgentDashboard.css
  AgentDashboard.md           (domain context, read by LLM workflows)
  AgentDashboard.test.jsx
  agent-dashboard-main.jsx    (the entry, mounts the app)
  SubComponent/               (subcomponent folder, same shape)
    SubComponent.jsx
    SubComponent.css
    SubComponent.test.jsx
```

The shape is recursive: subcomponents that warrant their own folder follow
the same convention. Subcomponents that don't warrant a folder live as
local functions inside the parent's `.jsx` file (see *Similarity of scale*
in [workflow](workflow.md)).

Tests are colocated. CSS is colocated. The component's own contextual
documentation is colocated. Everything a future reader needs in order to
understand one component sits next to it.

## Component-colocated `.md` files

In repos that use Azoth alongside LLM workflows, a `<Name>.md` colocated
with the JSX captures domain context — what the component represents in
business terms, how to interpret it, what trends matter, what the panel is
*for*.

This isn't an Azoth requirement. It's a pattern that works well with the
framework's transparency to AI tooling. The component's structure is plain
JSX evaluating to plain DOM; the colocated `.md` adds the meaning layer the
code itself can't carry. Code review automations and code-generation
workflows read these files alongside the JSX.

Keep them current when behavior changes. A stale `.md` is worse than no
`.md`.

## Component design

The component-design principles live in [workflow](workflow.md). In short:

- **Named functions over arrows** for top-level components. Anonymous
  arrow components hurt stack traces and devtools display, and they blend
  into a sea of arrows when scanning a file.
- **Table-of-contents pattern**: hoist the primary component to the top of
  the file; helpers below. A reader sees the shape before the details.
- **Similarity of scale**: subcomponents in the same file should be
  roughly the same complexity. A 40-line View next to a 4-line helper is
  a signal — either inline the helper or give the View its own file.

See [workflow § Component Design Principles](workflow.md#component-design-principles)
for the full discussion with examples.

## Naming for async props

Pass async data sources via an `async` prop:

```jsx
<UserProfile async={userPromise} />
<AgentDashboard async={dashboardPromise} />
```

Not via a domain-specific name like `userData` or `agentData`. The prop
name advertises the **contract** ("this is loading-with-async-data"), not
the **payload type**. The component name already carries the domain.

The `$` suffix on variable names is the symmetric convention for streams:

```js
const [results$, push] = stream(/* … */);
```

`results$` signals "this is a stream/channel," not a resolved value. A
reader doesn't have to chase down the declaration to find out whether
they can `.map()` it.

See [async-and-channels](../../packages/valhalla/channels.test.tsx) for the underlying
mechanics.

## Data fetching ownership

Data fetching belongs in the entry file (`<page>-main.jsx`), not inside
components:

```jsx
// agent-dashboard-main.jsx
import { AgentDashboard } from './AgentDashboard.jsx';
import { fetchAgent } from '../../services/agent-api.js';

const agentId = new URLSearchParams(location.search).get('agentId');
document.body.append(<AgentDashboard async={fetchAgent(agentId)} />);
```

The component receives the promise as a prop. It doesn't know where the
data came from.

This has three consequences:

- **Components are testable.** Pass a mock promise; assert on rendered
  DOM. No fetch mocking inside the component file.
- **Data orchestration is visible in one place.** When two components
  share data, the entry file does the `Promise.all` and threads the
  pieces in.
- **Side effects sit at the boundary.** The entry file is where I/O
  happens; component files stay pure.

The cost of inverting this (fetching inside components) is invisible at
first. It shows up later as tests that can't run without network mocks,
duplicate fetches when the same data is needed by siblings, and components
that can only be assembled in one place.

## Don't reach for `useState`-style local state machines

There is no `useState`. Don't synthesize one.

In a function component, local variables are local variables — the
function runs once, the closure holds across event handlers, the DOM is
already there to mutate directly:

```jsx
const Counter = () => {
    let n = 0;
    const label = <span>{n}</span>;
    return <button onclick={() => { n++; label.textContent = n; }}>{label}</button>;
};
```

When a component needs encapsulated state with methods that mutate DOM,
**write a class**. That's the web platform construct for the job, and
Azoth instantiates classes from JSX directly. See
[components](components.md) for the function and class contracts.

## Whitespace in JSX is preserved as text

Azoth doesn't normalize whitespace. What you write between tags is what
runs:

```jsx
const a = <main><p>hi</p></main>;
// → "<main><p>hi</p></main>"

const b = (
    <main>
        <p>hi</p>
    </main>
);
// → "<main>\n        <p>hi</p>\n    </main>"
```

The newlines and indentation become text nodes. For most rendered HTML
this is invisible — browsers collapse whitespace in flow content. But:

- **In `<pre>`, `<code>`, or any element with `white-space: pre`** etc.,
  the whitespace shows up visually.
- **In snapshot tests**, the indentation lands in the snapshot. Tests
  meant as worked examples (e.g. valhalla `*.test.tsx`) read more
  cleanly with single-line JSX so the input-to-HTML mapping stays
  obvious.

This is a deliberate design choice: the compiler shouldn't decide what
counts as significant whitespace; that's a runtime concern. JSX as you
wrote it is what runs — same as the rest of Azoth's design fidelity.

## What this is *not*

This is a subtraction, not a contrast. Conventions Azoth doesn't impose:

- No required directory layout
- No required file-name suffixes
- No required `index.js` barrels
- No required prop-typing scheme
- No required state-management adapter

The conventions above emerged from practice. Use them; replace them when
you have a better answer for your context. The point isn't the specific
shape — it's that **a deliberate convention beats no convention**, because
Azoth itself is staying out of your way.

## See also

- [Components](components.md) — function and class forms
- [JSX as DOM](jsx-as-dom.md) — why module-level JSX is a side effect
- [Workflow](workflow.md) — UI-first development; Component Design
  Principles in full
- [Async and Channels](../../packages/valhalla/channels.test.tsx) — channel usage; `$`
  variables, channels
- [For LLMs](for-llms.md) — terminology discipline
