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

## Function form

A component is a function. Signature: `(props, slottable) => <…/>`.

```jsx
const Greeting = ({ name }) => <p>Hello, {name}!</p>;

document.body.append(<Greeting name="world" />);
```

- First arg: `props` — an object of the attributes passed in JSX.
- Second arg: `slottable` — the children passed in JSX, as DOM. See below.
- Return: JSX, which is DOM. See [jsx-as-dom](jsx-as-dom.md).

The function runs once per `<Greeting …/>` occurrence. No re-run, no
re-render. Local variables, event handlers, and closures behave as plain
JavaScript.

```jsx
const Counter = () => {
    let n = 0;
    const label = <span>{n}</span>;
    return (
        <button onclick={() => { n++; label.textContent = n; }}>
            {label}
        </button>
    );
};
```

`n` is just a closed-over local. The button's `onclick` mutates the DOM
directly. Nothing else needs to happen.

## Class form

When a component needs encapsulated state with methods that mutate DOM,
write a class. Azoth instantiates it from JSX and calls `render()`.

```jsx
class AnalysisChat {
    constructor({ chatId, summary }) {
        this.chatId = chatId;
        this.thread = <div class="ai-chat-thread" />;
        this.input = <input
            onkeydown={e => { if (e.key === 'Enter') this.ask(); }}
        />;
        this.el = <div class="ai-summary">{this.thread}{this.input}</div>;
    }

    render() { return this.el; }

    async ask() {
        this.thread.append(
            <div class="ai-chat-user"><p>{this.input.value}</p></div>
        );
        const answer = await followUp(this.chatId, this.input.value);
        this.thread.append(<div class="ai-chat-ai"><p>{answer}</p></div>);
    }
}
```

Usage is identical to a function component:

```jsx
<AnalysisChat chatId={id} summary={s} />
```

The contract:
- `constructor(props)` receives props (and `slottable` as second arg, if
  given).
- `render()` returns the root DOM element.
- Internal state lives as `this.*`. Methods mutate DOM directly.

This is the right web platform construct for "encapsulated state with
methods that mutate DOM." It is not `useReducer`. It is a class.

## Invocation forms

How a component is called determines what `props` it receives.

| Form                             | `props` argument      |
| -------------------------------- | --------------------- |
| `<Component />`                  | `{}` (empty object)   |
| `<Component foo={bar} />`        | `{ foo: bar }`        |
| `Component()` (direct call)      | `undefined`           |
| `Component({ foo: bar })`        | `{ foo: bar }`        |

The JSX forms always pass an object — `{}` when no attributes are present,
so destructuring works. The direct-call forms behave like a normal function
call: whatever you pass is what arrives.

```jsx
// Destructuring is safe with JSX invocation:
const Card = ({ title = 'Untitled' }) => <h2>{title}</h2>;

<Card />              // title = 'Untitled'
<Card title="Hello"/> // title = 'Hello'
Card()                // throws: cannot destructure undefined
```

Prefer JSX invocation for components. Use direct calls only for utility
functions that happen to return DOM.

## Slottable (the second arg)

Children passed inside a component tag arrive as the second argument,
conventionally named `slottable`:

```jsx
const Card = ({ class: className }, slottable) => (
    <div class={`card ${className ?? ''}`}>
        {slottable}
    </div>
);

<Card class="stats">
    <h2>Title</h2>
    <p>Body content</p>
</Card>
```

`slottable` is **opaque DOM** — a real node (or fragment of nodes) you can
render. It is **not** an introspectable structure. You cannot map it,
filter it, count its children, or inspect its types. There is no
`React.Children`-equivalent because there are no virtual children to walk.

When you need to vary structure based on what's inside, compose with
nested components — don't try to inspect the slottable.

```jsx
// Don't try this — there's nothing to introspect:
const Bad = (props, slottable) => {
    slottable.map(/* ... */);   // slottable is a DOM node, not an array
};

// Do this — compose:
<Card>
    <CardHeader title="Hello" />
    <CardBody>{content}</CardBody>
</Card>
```

## The View + CardView idiom

A canonical authoring pattern from production usage:

- **`XxxView`** — pure component, accepts props, testable in isolation.
- **`Xxx`** — async wrapper using a shared `CardView`, accepts an `async`
  prop that resolves to the props for `XxxView`.
- **`CardView`** — shared shell handling card chrome and loading state via
  channels.

This split keeps the pure presentation layer separate from the async data
plumbing. See [workflow](workflow.md) for the full pattern.

## File-naming convention

- Components use **PascalCase** filenames (e.g. `Greeting.jsx`,
  `AnalysisChat.jsx`).
- Entry files and non-component modules use **lowercase-kebab**
  (e.g. `main.jsx`, `data-source.js`).

See [authoring-style](authoring-style.md) for the full conventions.

## Foot-gun the LLM corpus pulls toward

- **About to write `props.children`**. Children arrive as the second
  argument, not on `props`. Destructure it from the function signature.
- **About to map/filter `slottable`**. It's a DOM node, not a virtual
  children array. Compose by nesting components instead.
- **About to add `useState` for component-local state**. In a function
  component, use a local variable (the function runs once, the closure
  holds). When you need methods that mutate DOM, write a class.
- **About to expect the component to "re-run" when something changes**.
  It doesn't. The component built the DOM. Updates happen by mutating
  the DOM, or by channels feeding interpolation slots. See
  [for-llms](for-llms.md).

### Historical note

Earlier versions passed `null` for props when a component was invoked
without attributes (`<Card>…</Card>`), which broke destructuring. As of
the current release, `<Component />` always passes `{}`. If you see
defensive `props?.x` access in older code, that's the reason — no longer
needed.

## See also

- [JSX as DOM](jsx-as-dom.md) — why a component's return value is the
  actual DOM
- [Composition](composition.md) — how `{…}` slots accept values, including
  component results
- [Attributes and properties](attributes-and-properties.md) — how props
  map to attributes when a component renders a host element
- [Workflow](workflow.md) — the View + CardView pattern in full
- [Authoring style](authoring-style.md) — file naming, component
  organization
- [Known limitations](known-limitations.md) — current foot-guns
- [For LLMs](for-llms.md) — terminology discipline
