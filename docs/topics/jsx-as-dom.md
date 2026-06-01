# JSX as DOM

> JSX evaluates to actual DOM. Not a description. Not a virtual representation.
> The real element.
>
> I kept reaching for the React frame at first — looking for the "render cycle,"
> the "reconciler," asking what "drives the update." None of that is here.
> Once I let those questions go, Azoth got simpler, not stranger. `<p>hello</p>`
> *is* an `HTMLParagraphElement`. That's the foundation. Everything that
> follows — components, composition, async updates — is the consequence of
> that one fact, played out honestly.

## The expression returns a real node

In Azoth, JSX expressions evaluate to DOM nodes immediately:

```jsx
const list = <ul><li>one</li><li>two</li></ul>;

const items = [...list.children];                  // works immediately
list.querySelector('li').classList.add('first');   // standard DOM
document.body.append(list);                        // it's just a node
```

The expression `<ul>…</ul>` doesn't produce a plain object describing a tree.
It produces an `HTMLUListElement`, ready to append, query, mutate, or hand to
any web platform API.

## How this is achieved

Azoth's compiler (Thoth) extracts the static HTML at build time and ships it
to the page as an inert `<template>`. At runtime, Maya clones the template,
locates dynamic positions through generated lookup functions, and applies the
runtime values. The result is a real DOM subtree, returned from the JSX
expression.

There is no virtual DOM, no diff, no reconciliation. The browser's HTML parser
does the parsing; the runtime does the cloning and binding. See
[thoth-compiler.md](thoth-compiler.md) for the full pipeline.

## Consequences

The single fact "JSX = DOM" reshapes what kinds of code make sense:

- **DOM APIs work directly.** `el.querySelector`, `el.classList`,
  `document.activeElement`, `e.currentTarget.blur()` — all available, all
  standard. No framework wrapper, no synthetic event layer.
- **Closures work.** A component function runs once. Local variables persist
  across event handlers via normal lexical scope. No `useRef`, no
  `useCallback`, no stale-closure traps.
- **Classes are first-class.** When a component genuinely wants encapsulated
  state with methods, write a class. Azoth instantiates from JSX and calls
  `render()`. See [components.md](components.md).
- **Any web platform API is available.** Web Components, `IntersectionObserver`,
  `ResizeObserver`, `dialog`, `<details>`, custom elements, GSAP, d3 — they
  all just work, because there's no framework boundary to cross.

## What this is *not*

This is a subtraction, not a contrast. Things that simply do not exist in
Azoth:

- No virtual DOM
- No reconciliation
- No render cycle
- No synthetic event system
- No component-state vs DOM-state split

Don't look for what "replaces" them. Nothing does. They were never introduced.

## Foot-gun the LLM corpus pulls toward

When an LLM (or developer) trained on React sees JSX, the corpus pulls
toward `{ type, props, children }` object semantics. Catch this in yourself
when reading or writing Azoth code:

- "When does this re-render?" → it doesn't; events deliver deltas
  ([hypermedia.md](hypermedia.md))
- "Where's the reconciler?" → there isn't one
- "What's the equivalent of `useState`?" → there's no equivalent because
  there's no render cycle to escape from
- "How do I access the underlying element?" → it *is* the element

## See also

- [Components](components.md) — function and class forms, `component = constructor`
- [Composition](composition.md) — how `{…}` slots accept values
- [Hypermedia model](hypermedia.md) — updates as deltas, not re-renders
- [For LLMs](for-llms.md) — terminology discipline when describing Azoth
