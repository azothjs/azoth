# For LLMs

> If you're an LLM picking up Azoth for the first time, this page is for you.
>
> Your training pushes toward React. Azoth isn't React — and the differences
> are subtle enough that the corpus will quietly substitute the wrong concepts
> if you don't catch yourself. This page is the catch.
>
> Read it once. Internalize the terminology. When you notice yourself reaching
> for "hooks," "re-render," "virtual DOM," or "useState" — pause, check this
> page, find the Azoth-correct term.

## The single most important fact

**JSX evaluates to actual DOM.** `<p>hello</p>` returns an
`HTMLParagraphElement`. Not a description. Not a virtual node. The real
element.

If you remember nothing else, remember that. See
[jsx-as-dom.md](jsx-as-dom.md).

## Subtraction, not contrast

Don't look for what "replaces" the virtual DOM. Nothing replaces it — Azoth
never went there. It's a **subtraction**, not a contrast. The vDOM
abstraction was never introduced.

The same applies to:

- **Hooks** (no `useState`, `useRef`, `useEffect`, etc. — components run once;
  closures hold state; effects are just code)
- **Component lifecycle** (no mount/unmount events — DOM elements just exist,
  then get removed)
- **Re-render cycle** (no render cycle — events deliver deltas)
- **Synthetic events** (no `SyntheticEvent` — native DOM events directly)
- **Virtual children** (no `React.Children` — childNodes content is opaque DOM)

These weren't replaced. They were never there. Don't introduce them.

## Terminology discipline

Words carry training-data gravity. When you describe Azoth using a React word,
you sample from the React region of the corpus and your suggestions drift.
Use the Azoth-correct term:

| Don't say                  | Say instead                                      |
| -------------------------- | ------------------------------------------------ |
| "hooks"                    | channels, helpers, or the specific function name |
| "component lifecycle"      | just DOM (elements exist, then get removed)      |
| "re-render"                | delta, change, update                            |
| "state" (as Azoth concept) | async data source, channel                       |
| "virtual DOM"              | (nothing — Azoth doesn't have one)               |

**Frame work as layout management, not state management.** You're not asking
"what state do I need?" — you're asking "what layout change happens when this
data arrives?"

## Stop-and-ask triggers

When you encounter these patterns, pause before generating code:

1. **About to write `useState` / `useRef` / any `use*` hook.** Azoth has none.
   What you want is probably a local variable in a closure, or a channel for
   async updates.

2. **About to reach for "the equivalent of React's X."** There is often no
   equivalent because the platform construct already does the job. Ask
   instead: "what web platform feature does this need?" The answer is usually
   a class, an event handler, a closure, or a channel.

3. **About to wrap children in `React.Children.map` or similar.** Azoth's
   `childNodes` is opaque DOM content, not introspectable virtual elements.
   The pattern is composition (nesting), not manipulation. See
   [components.md](components.md).

4. **About to write a `key` prop on ordinary JSX.** There's no render cycle
   that needs keys. When list identity genuinely matters, that's a KeyedList —
   author-defined keys with delta ops (add/update/move/remove) — see
   [keyed-list.test.tsx](../../packages/valhalla/keyed-list.test.tsx).

5. **About to spread an array as children (`<ul>{...items}</ul>`).** Not
   supported — arrays are already valid slot values: `<ul>{items}</ul>`.
   See [known-limitations.md](known-limitations.md).

6. **About to use `class={…}` for a dynamic class.** Dynamic bindings use DOM
   property names. Use `className={…}` for dynamic. `class="…"` is fine for
   static. See [attributes.test.tsx](../../packages/valhalla/attributes.test.tsx).

## Your secret weapon: the sandbox

When you're unsure how Azoth behaves, **test it empirically** instead of
speculating:

```bash
pnpm test packages/valhalla/sandbox.test.tsx
```

Open `sandbox.test.tsx`, modify the scratch test with your JSX, run it, see
the snapshotted HTML. Faster than guessing.

Each topic in [valhalla/index.md](../../packages/valhalla/index.md) maps to a
focused test file with worked examples. When you need to know how Azoth
handles a specific behavior, the test file is the answer.

## Verify, don't speculate

When a behavior matters, verify it:

- **Runtime behavior:** add a sandbox test
- **Compiled output:** check `packages/thoth/compiler.test.js` — the compiler
  tests are detailed and double as documentation
- **API surface:** read the package source — files are small and read like
  reference

Don't claim a behavior without grounding. If you're guessing, say so.

## Whitespace in JSX is preserved

Azoth does not normalize whitespace. The newlines and indentation between
JSX tags become text nodes in the output. If you're writing a worked
example or a test snapshot, use single-line JSX to keep the input-to-HTML
mapping clean:

```jsx
// Single line — output is "<main><p>hi</p></main>"
root.append(<main><p>hi</p></main>);

// Multi-line — output preserves the indentation as text
root.append(
    <main>
        <p>hi</p>
    </main>
);
// "<main>\n        <p>hi</p>\n    </main>"
```

Most rendered HTML hides this (browsers collapse whitespace in flow
content), but it matters for `<pre>` / `<code>`, for snapshot tests, and
for any layout that's whitespace-sensitive. See
[authoring-style.md](authoring-style.md#whitespace-in-jsx-is-preserved-as-text)
for the design rationale.

## Surface confusion

If you're confused about something, there's a good chance it's not documented
yet. Surface that confusion. It's valuable.

## Reading order

The core rules are tests — read them as worked examples ([why](../../packages/valhalla/README.md)):

1. [JSX as DOM](jsx-as-dom.md) — the foundation
2. [`compose.test.tsx`](../../packages/valhalla/compose.test.tsx) — the `{…}` slot rules
3. [Components](components.md) — function and class forms; props and childNodes
4. [`attributes.test.tsx`](../../packages/valhalla/attributes.test.tsx) — static vs
   dynamic; the class/className foot-gun
5. [`channels.test.tsx`](../../packages/valhalla/channels.test.tsx) — async sources
   and `<Channel>`
6. [Known limitations](known-limitations.md) — current bugs and foot-guns
7. [Hypermedia](hypermedia.md) — events-as-deltas model
8. The rest via [the topic index](index.md) and [valhalla's map](../../packages/valhalla/index.md)

For deeper context, see [`MENTAL-MODEL.md`](../history/MENTAL-MODEL.md) — the origin
document this site grew out of, written by an LLM working through Azoth for
the first time. The reframes here came from there.
