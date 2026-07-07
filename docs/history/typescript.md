# TypeScript

> JSX returns real DOM elements, but TypeScript types them all as generic
> `Node`. That mismatch tripped me at first — the runtime knows it built an
> `HTMLInputElement`, the type system says it built a `Node`. Then I noticed
> the asymmetry was deliberate. TypeScript's JSX type system has no
> per-tag return type mechanism; there is no `JSX.IntrinsicElementReturnTypes`
> to populate. So Azoth picks the honest, broad type and lets you assert
> down when you need a specific DOM API.
>
> Once I saw it as a constraint of TypeScript's JSX model rather than an
> Azoth shortcoming, the assertion pattern stopped feeling like a workaround
> and started feeling like what it is: a refinement step. The assertion is
> type-safe because Azoth literally creates that element type at runtime.

## The type model

TypeScript's JSX type system exposes two mappings:

- **`IntrinsicElements`** — props validation per tag. Every standard HTML
  tag is listed, and its attributes are typed against the HTML attribute
  set. This works.
- **`Element`** — the single return type for *all* JSX expressions. Azoth
  sets this to `Node`.

```typescript
// From packages/azoth/jsx.d.ts
namespace JSX {
    type Element = Node;
    interface IntrinsicElements { /* every HTML tag */ }
}
```

`Node` is intentionally broad. It covers any element, fragment, or text
node a JSX expression might evaluate to. Composition works at this level;
specific DOM APIs don't.

See [`packages/azoth/JSX-TYPES.md`](../../packages/azoth/JSX-TYPES.md) for
the package-level type architecture.

## When to use a type assertion

The decision rule is simple:

- **Composition** — nesting, passing to other components, appending to a
  parent — needs no assertion. `Node` is enough.
- **DOM manipulation** — calling `.focus()`, reading `.value`, calling
  `.play()` — needs an assertion to the specific element type.

```tsx
// Composition: no assertion needed
const page = (
    <main>
        <Card title="Stats">
            <StatValue value={42} />
        </Card>
    </main>
);

document.body.append(page); // Node is sufficient
```

```tsx
// DOM manipulation: assert to access specific properties
const input = <input type="text" /> as HTMLInputElement;
input.focus();        // TypeScript knows .focus() exists
input.value = 'hi';   // and .value
```

## Why the assertion is type-safe

In React, an assertion like `<p>hello</p> as HTMLParagraphElement` is a lie
the developer makes to the compiler — React returns a virtual element, not
a paragraph. In Azoth, the same assertion is a **refinement**, not a lie:
the JSX expression literally creates an `HTMLParagraphElement` at runtime.
See [jsx-as-dom](jsx-as-dom.md).

The assertion isn't bridging different things; it's narrowing a too-broad
type to the specific type the runtime already produces.

## Component author guidance

Annotating a component's return type is **optional**. It's useful when
consumers will treat the component as a specific DOM element.

```tsx
// Useful: consumers likely need HTMLVideoElement APIs
const VideoPlayer = ({ src }) => (
    <video src={src} controls />
) as HTMLVideoElement;

const player = <VideoPlayer src="clip.mp4" />;
player.play();   // works without further assertion

// Not needed: pure display, callers won't touch DOM APIs
const Greeting = ({ name }) => <p>Hello, {name}</p>;
```

The general rule: if your component is meant to be operated on (form
input, media element, canvas), annotate. If it's meant to be displayed,
the default `Node` is fine.

## Known limitation

TypeScript has no per-tag JSX return type mechanism. You cannot have
`<input/>` automatically typed as `HTMLInputElement` — the language
provides one `Element` type for all JSX expressions.

This is a TypeScript limitation, not an Azoth one. A potential future
TypeScript contribution would add `JSX.IntrinsicElementReturnTypes`. Until
then, explicit assertion is the bridge.

## TypeScript doesn't enforce HTML content models

TypeScript will accept `<div>` inside `<p>` without errors, even though
that's invalid HTML and the browser will fix the nesting at runtime. This
isn't Azoth-specific — TypeScript's JSX types don't model HTML's
content-model rules. Don't expect type errors for semantic-HTML mistakes.

## Gotcha: don't mix `jsx.d.ts` and `jsx-runtime.d.ts`

Pick one. The two mechanisms conflict — `jsx.d.ts` defines a global
namespace, while `jsx-runtime.d.ts` defines an exported namespace, and
having both registered makes TypeScript's JSX resolution unstable.

The valhalla package uses `jsx.d.ts`, referenced via a `<reference
path>` directive. If you change anything in the type declarations, restart
the TypeScript server — IDEs cache stale JSX types aggressively.

For more context, see
[`packages/azoth/JSX-TYPES.md`](../../packages/azoth/JSX-TYPES.md).

## `.tsx` files

`.tsx` works. The vite-plugin pre-processes TypeScript away before Thoth
sees the JSX, so the compiler operates on plain JavaScript syntax with JSX.
The result is that `.tsx` and `.jsx` produce identical compiled output —
the TypeScript layer is purely authoring-time.

See [build-and-integration](build-and-integration.md) for the build
pipeline detail.

## What this is *not*

This is a subtraction, not a translation. Things that don't exist in
Azoth's type story:

- No per-component prop interfaces required (props are plain destructured
  arguments)
- No generic `Component<Props>` wrapper type — a component is just a
  function
- No `RefObject`/`ForwardedRef` machinery — the JSX expression itself is
  the ref
- No `ReactNode` / `ReactElement` distinction — there is `Node`

## See also

- [JSX as DOM](jsx-as-dom.md) — why the assertion is a refinement, not a lie
- [Components](components.md) — function and class forms; where annotation
  matters
- [Build and integration](build-and-integration.md) — how `.tsx` flows
  through the pipeline
- [For LLMs](for-llms.md) — terminology discipline
- [`packages/azoth/JSX-TYPES.md`](../../packages/azoth/JSX-TYPES.md) —
  package-level type architecture
