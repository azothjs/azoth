# Valhalla — Test File Index

Topic → file map. If you're an LLM looking up azoth behavior, find the
topic and load only that file — the test code is the example, the frozen
expectation is verified output. Conventions and how to read the snapshots
(`<!--az:N-->`, `data-bind`): [`README.md`](./README.md).

## Topic map

| Topic | File | What it covers |
|---|---|---|
| **JSX evaluates to DOM** | [`smoke.test.tsx`](./smoke.test.tsx) | `<p>hello</p>` returns an `HTMLParagraphElement`; standard DOM APIs work directly on JSX output. |
| **The `{…}` slot** | [`compose.test.tsx`](./compose.test.tsx) | The compose rules: values (strings, numbers, falsy-renders-nothing, Nodes, arrays), functions as deferred values, async sources direct in slots (promise / generator / stream — replace by default), the Input shape `{ initial, from, append }`, and reading `az:N` anchors. |
| **Attributes vs properties** | [`attributes.test.tsx`](./attributes.test.tsx) | Static attributes compile to template HTML; dynamic bindings assign DOM properties (`className`, `htmlFor`); `data-*` → `setAttribute`; NON_STATIC promotion (`autofocus`). |
| **Components: forms** | [`component-forms.test.tsx`](./component-forms.test.tsx) | Arrow / class / object+`initialize` forms; created vs composed (top-level JSX returns the instance); the chain rule; null renders nothing; the update verb under a rerenderer; pointed errors for primitives/Nodes in component position. |
| **Components: invocation** | [`component-invocation.test.tsx`](./component-invocation.test.tsx) | `<Component/>` passes `{}`, `<Component foo={x}/>` passes `{foo: x}`, `Component()` passes `undefined` — destructuring is safe under JSX invocation. |
| **Components: childNodes** | [`child-nodes.test.tsx`](./child-nodes.test.tsx) | JSX content arrives as the second argument — composed, opaque DOM; compose by nesting. |
| **Element binding positions** | [`element-bindings.test.tsx`](./element-bindings.test.tsx) | Root vs child element bindings produce different template structures; both verified, including mixed cases. |
| **Channel** | [`channels.test.tsx`](./channels.test.tsx) | `<Channel source as error map append eventType>` over promise / async iterator / stream / Observable / EventTarget sources; initial children; class and instance forms. |
| **Rerenderer** | [`rerenderer.test.tsx`](./rerenderer.test.tsx) | Re-execution rebinds the same DOM; branches sleep, lists shrink by position; per-site identity; setup-runs-once patterns; Channel source switching under rerender. |
| **Keyed lists (frames)** | [`keyed-list.test.tsx`](./keyed-list.test.tsx) | KeyedUList/KeyedOList/KeyedTable custom elements; delta ops (add/insert/update/move/remove/clear/keyFor); controller pattern; nesting inside a rerenderer. |
| **SVG** | [`svg.test.tsx`](./svg.test.tsx) | SVG elements and attributes through the same pipeline. |
| **Scratch / sandbox** | [`sandbox.test.tsx`](./sandbox.test.tsx) | Empirical scratch space — modify and run when unsure how azoth behaves. |

## How to add a test

1. **Verify empirically** in [`sandbox.test.tsx`](./sandbox.test.tsx) first.
2. **Add to the topic file that fits**, with teaching comments; freeze the
   generated output per [`README.md`](./README.md) conventions.
3. **Update the topic map** if you created a new file.
4. **Cross-reference** `packages/thoth/compiler.test.js` when the behavior
   depends on compilation, and the maya unit suite
   (`packages/maya/compose/*.test.js`) for mechanism-level rules.
