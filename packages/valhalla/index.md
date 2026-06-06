# Valhalla — Test File Index

Topic → file map for the Valhalla integration tests. If you're an LLM
looking up Azoth behavior, find the relevant topic below and load only that
test file — the test code is the example and the inline snapshot is the
verified output.

For framework conventions and how to add tests, see [`README.md`](./README.md).

## Topic map

| Topic | File | What it covers |
|---|---|---|
| **JSX evaluates to DOM** | [`smoke.test.tsx`](./smoke.test.tsx) | `<p>hello</p>` returns an `HTMLParagraphElement`. Standard DOM APIs work directly on JSX output. |
| **ChildNodes (children)** | [`childNodes.test.tsx`](./childNodes.test.tsx) | Children passed as the second argument; opaque DOM; composition by nesting. |
| **Attributes vs properties** | [`attributes.test.tsx`](./attributes.test.tsx) | Static attributes compile to HTML; dynamic interpolation assigns DOM properties. `class={var}` doesn't work — use `className={var}`. |
| **Component invocation** | [`component-invocation.test.tsx`](./component-invocation.test.tsx) | `<Component/>` passes `{}`, `<Component foo={x}/>` passes `{foo: x}`, `Component()` passes `undefined`. Destructuring is safe under JSX invocation. |
| **Element binding positions** | [`element-bindings.test.tsx`](./element-bindings.test.tsx) | Root vs child element bindings produce different template structures (tMap). Both patterns verified, including mixed cases. |
| **Scratch / sandbox** | [`sandbox.test.tsx`](./sandbox.test.tsx) | Empirical-testing scratch space — modify and run when you're unsure how Azoth behaves. |

## Topics planned but not yet split

The following topics have docs in `docs/topics/` but don't yet have
dedicated test files here. Add them as their behavior surface area justifies
dedicated tests:

- `text-interpolation.test.tsx` — `{value}` in child positions across the
  type chain (string, number, null, false, etc.)
- `async-children.test.tsx` — Promise / async iterator / observable in
  child slots
- `channels.test.tsx` — `channel()`, options (`init`, `start`, `map`),
  `tee`, `branch`, `consume`
- `fragments.test.tsx` — `<>…</>` returns a `DocumentFragment`
- `compose-resolution.test.tsx` — the full resolution chain from
  `docs/topics/composition.md` exercised end-to-end

## How to add a test

When you discover behavior worth documenting:

1. **Verify empirically** in [`sandbox.test.tsx`](./sandbox.test.tsx) first
2. **Create a permanent test** in the topic file that fits, with
   explanatory comments
3. **Update the topic map above** if you created a new file
4. **Update `docs/topics/`** if the behavior wasn't already documented
5. **Cross-reference compiler tests** in
   `packages/thoth/compiler.test.js` if the behavior depends on compilation

See [`README.md`](./README.md) for the test pattern conventions (fixture
helper, inline-snapshot format, `/* HTML */` directive).
