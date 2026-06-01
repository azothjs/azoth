# Thoth — What JSX Compiles To

> Thoth extracts HTML at build time and ships it as a template the browser
> parses. The browser's HTML parser does the parsing, not JavaScript at
> runtime. The JS calls just clone the template and apply dynamic values.
>
> I came in expecting a compiler-as-emitter: take JSX, produce
> `createElement` calls, ship them. That's not what Thoth does. The
> static HTML is *extracted* out of the JSX and lifted into the document
> as inert markup; what's left in the JS is a thin lookup-and-bind layer
> over a cloned subtree. Once that landed, a lot of what I was looking
> for ("how does it construct nodes? where's the createElement?") just
> dissolved — the browser does the construction, because the browser is
> already the best HTML parser there is.

## The reframe

JSX-based frameworks usually treat JSX as a function call wrapped in
syntactic sugar. `<p>hi</p>` becomes `h('p', null, 'hi')`, and at
runtime, JavaScript walks the resulting object tree to construct DOM
nodes one at a time.

Thoth separates the **static HTML** (parts that don't depend on runtime
values) from the **dynamic positions** (`{…}` slots and attribute
interpolations), ships the static HTML as a `<template>` the browser
parses *once* at load, and emits JS that knows how to clone the
template and apply runtime values to the precise nodes that need them.

That's it. No per-element `createElement`. No JS-driven tree
construction. The browser's HTML parser does the heavy work.

## The high-level pipeline

```
JSX source
   │
   ├─ Parse:    JSX → AST  (Acorn + acorn-jsx)
   │
   ├─ Extract:  walk AST, separate static HTML from dynamic positions
   │
   ├─ Generate: HTML templates, targets functions, bind functions,
   │            renderer wiring
   │
   └─ Output:   transformed JS that imports the runtime (Maya) and
                calls the generated pieces
```

The full walk-through, with field-by-field metadata and Maya
integration, is in
[packages/thoth/COMPILER.md](../../packages/thoth/COMPILER.md). The
overview below points at the pieces; that document is the reference.

## The three generators

Thoth's output for a JSX expression is decomposed into three functions
that work together. The decomposition is what enables deduplication
(below) and the render-engine abstraction (below).

- **`targets`** — given the cloned template root, returns the array of
  precise DOM nodes that need runtime values. Uses two sources of
  truth: `data-bind` attributes on elements with dynamic children
  (located via `querySelectorAll('[data-bind]')` in document order),
  and child-index walks within those elements.
- **`bind`** — given the array of targeted nodes, returns a function
  that applies runtime values: property assignment for attributes,
  child composition via Maya's `__c` for `{…}` text slots, component
  composition via `__cC`, dataset writes, spread, and so on.
- **`renderer`** — calls Maya's `__renderer` with the template id, the
  targets function, the bind function, the fragment flag, and the HTML
  content. This is the call the developer's JSX expression actually
  becomes.

See [packages/thoth/COMPILER.md](../../packages/thoth/COMPILER.md) for
the exact shape of each.

## A concrete example

Input:

```jsx
const t = <p className={status}>Hello {name}</p>;
```

What Thoth produces:

```javascript
// Transformed JS
import { te6c2b6be } from 'virtual:azoth-templates?id=e6c2b6be';
const t = te6c2b6be(status, name);
```

```javascript
// Extracted HTML template (ships in the document)
<p>Hello <!--0--></p>
```

The `<!--0-->` comment is the trick that preserves child-node structure
across a dynamic text slot — without it, "Hello " and the surrounding
static text would merge into one text node. The comment is a tangible
child the runtime can locate and replace.

The full template metadata (target map, bind map, hashes) and the exact
generated `targets` / `bind` functions are in
[packages/thoth/COMPILER.md](../../packages/thoth/COMPILER.md) — see
"The Three Generators" for the worked-out functions.

## Why extract HTML

The browser's HTML parser is:

- **faster** than any JavaScript-driven `createElement` loop
- **more correct** — it handles edge cases (table parsing, foreign
  content, self-closing tags, character references) the platform has
  spent decades getting right
- **more capable** — it produces real DOM elements with prototype
  methods, observed attributes, and custom-element upgrades intact

By handing the parser the inert HTML up front, Azoth trades
per-instance JS construction for a one-time parse and cheap subsequent
clones. The JS does only what JS is good at: applying runtime values to
known positions.

This is also why JSX in Azoth is "JSX as DOM" rather than "JSX as
virtual node" — the value flowing out of the expression is the result
of `cloneNode(true)` plus binding, not a JS-built tree. See
[jsx-as-dom](jsx-as-dom.md).

## Deduplication

The decomposition into separate templates, `targets`, and `bind`
functions enables structural deduplication:

- **Identical HTML templates** share an id (same content hash → same
  template).
- **Identical binding patterns** share a `bind` function (e.g.
  `<p>{x}</p>` and `<div>{y}</div>` have different HTML but the same
  one-child-compose binding shape, so they share a `bind`).

This isn't tree-shaking. It's content-level deduplication driven by
structural hash. Two components written independently that happen to
share a binding pattern share the compiled function.

## Render-engine abstraction

Thoth currently targets the DOM, but the generated functions don't
*name* the DOM specifically — they call into Maya's renderer
abstraction. An HTML-string renderer (for SSR) is in progress: Maya's
runtime would consume the same generated `targets` and `bind` shapes
but produce HTML strings instead of DOM nodes. The compiled artifact
wouldn't change; only the renderer underneath would. See
[maya-runtime](maya-runtime.md).

## TypeScript / TSX

Thoth uses Acorn and **does not parse TypeScript directly**. The
vite-plugin pre-processes `.tsx` via esbuild with `jsx: 'preserve'`,
which strips types and keeps the JSX intact for Thoth to consume.

If you're compiling Azoth code outside the vite-plugin, the type-strip
step is on you. See [build-and-integration](build-and-integration.md)
for the integration layer.

## Authoring foot-gun: comments inside returned JSX

`{/* comment */}` nodes inside JSX you return from a component can
crash the compiler/runtime — the anchor positioning for dynamic
children doesn't currently account for comment nodes between siblings.
Use a code-level comment outside the JSX expression instead. See
[known-limitations](known-limitations.md) for the full entry.

## What this is *not*

This is a subtraction frame, not a contrast frame. Things Thoth does
not produce, because they were never introduced:

- No `createElement` call tree
- No virtual node objects
- No reconciler-driven re-render
- No per-node JavaScript construction

Don't look for what "replaces" them. Nothing does. The HTML parser
took the work back.

## See also

- [JSX as DOM](jsx-as-dom.md) — why the value of a JSX expression is a
  real DOM node
- [Maya runtime](maya-runtime.md) — what the generated functions call
  into at runtime
- [Composition](composition.md) — how `{…}` slots accept values, which
  is what `bind` is applying
- [Known limitations](known-limitations.md) — including the
  JSX-comments foot-gun
- [Build and integration](build-and-integration.md) — vite-plugin, TSX
  pre-processing, virtual imports
- [For LLMs](for-llms.md) — terminology discipline when describing the
  compilation model
- [packages/thoth/COMPILER.md](../../packages/thoth/COMPILER.md) — the
  deep reference: template metadata, the three generators, runtime
  integration, dev vs prod, deduplication mechanics
