# Components

> **Component = constructor.** It runs once. It returns DOM. The DOM it
> returns is the DOM the page gets.
>
> I came in looking for the render cycle — when does the component re-run,
> how do I memoize, where does state live across renders. None of that is
> here. The function (or class) is invoked at JSX-evaluation time, builds
> the DOM, and hands it back. After that, the DOM is what changes; the
> component doesn't run again.
>
> Once I held that, a lot of the React scaffolding I was reaching for
> dissolved. Local variables are just local variables. Closures hold across
> event handlers because the closure was only created once. When I needed
> encapsulated state with methods that mutate the DOM, I reached for a
> class — and the class worked, directly, as a component. The platform
> already had the construct.

## The rules, as tests

The mechanics live in valhalla — runnable, frozen, current:

- [`component-forms.test.tsx`](../../packages/valhalla/component-forms.test.tsx) —
  every constructible form (arrow, class, object + `initialize`), the chain
  rule, null renders nothing, the update verb under a rerenderer, and the
  pointed errors for non-constructible things
- [`component-invocation.test.tsx`](../../packages/valhalla/component-invocation.test.tsx) —
  `<C/>` passes `{}` (destructuring-safe); direct calls pass exactly what
  you give them
- [`child-nodes.test.tsx`](../../packages/valhalla/child-nodes.test.tsx) —
  children arrive as the second argument, composed to ONE Node; opaque —
  compose by nesting, never introspect

## Which form, when

- **Function** — the default. Pure props → DOM. Locals and closures carry
  any per-instance values; event handlers mutate the DOM directly.
- **Class** — encapsulated state with methods that mutate DOM. Azoth
  instantiates it from JSX and drives `render()`. This is the platform's
  construct for the job — not `useReducer`. A class.
- **Object** (`{ initialize?, render, update? }`) — a pre-built literal;
  `initialize(props, childNodes)` is its constructor moment. `update` opts
  the instance into in-place updates under a rerenderer.

## Created vs composed

Where the JSX sits decides. A component at the **top level** of a JSX
expression is *created* only — the instance is the value you hold
(`const chat = <AnalysisChat/>`). **Embedded** in JSX, it's created *and
composed* — fully resolved into DOM at its anchor. Pinned in
[`component-forms.test.tsx`](../../packages/valhalla/component-forms.test.tsx)
("created vs composed").

## See also

- [JSX as DOM](jsx-as-dom.md) — why a component's return value is the
  actual DOM
- [Frames](frames.md) — when a component owns its own update clock
- [For LLMs](for-llms.md) — the corpus foot-guns (`props.children`,
  `useState`, expecting re-runs)
