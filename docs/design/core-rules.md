# Core rules

The whiteboard, materialized (from `azoth-rules.jpeg`, 2026-07; delete the
photo once this is verified). One line per rule; file pointers for the code.
These rules ARE the feature surface — valhalla expresses them as tests.

## thoth — compile time (`packages/thoth`)

| Op | Rule |
|---|---|
| html → id | Static HTML extracted per JSX expression; shipped as `<template id>` in the .html page. `id = hash(html + bindKey + targetKey)` — identical templates dedupe. `transform/Template.js` |
| refine | Target selection: generated function walks `childNodes` indices (and `[data-bind]` elements) to the bound nodes. `transform/template-generators.js` |
| bind (dom parts) | Generated binder applies runtime values: JS property assignment · `setAttribute` (data-*) · `__compose` (child slots) · `__composeComponent`. |
| createComponent | Component at the top level of a JSX expression → created only; the instance is the value. |
| composeComponent | Component inside JSX → create + compose: fully resolved into the DOM at its anchor. |
| renderer | Per-call-site template factory: `__render(id, targets, bind, isFragment)`. Site closure identity keys the rerenderer cache. `maya/renderer/render.js` |

Anchors are materialized into template HTML as `<!--az:0-->`. The `az:`
prefix is the trust boundary: runtime bookkeeping is `az:<count>` (count of
nodes the slot owns), and clear() only trusts/recurses az:-prefixed
comments — authored comments in content are plain nodes.

## maya — runtime (`packages/maya`)

### props

- Static `attr="value"` → compiled into template HTML (attributes).
- Dynamic `attr={value}` → runtime DOM property assignment, so the name is
  the property (`className`, `htmlFor`, …); `data-*` → `setAttribute`;
  `{...spread}` → `Object.assign`.
- Applies to intrinsic elements, custom elements, and component props;
  html + svg.

### compose — the `{…}` slot (`compose/compose.js`)

One dispatch, first match wins:

- **values**: `undefined · null · true · false · ''` clear the slot;
  `IGNORE` is a no-op (keep current content); string/number/bigint → text;
  `Node` → inserted (a DocumentFragment counts all its children into the
  anchor); array → clear once, then each member accumulates at the anchor.
- **derived (sync)**: function → called with no args (a deferred value, not
  a component), result re-enters compose; object with `.render()`
  (UIComponent) → `render()` result composes.
- **async**: Promise · async iterable (async generators, ReadableStream,
  anything `[Symbol.asyncIterator]`) · Observable (`.subscribe`). Each value
  REPLACES the previous — one rule for every source. Accumulation is opt-in
  upstream: `append` on Channel/Input.
- **Input shape** `{ initial?, from, append? }` — "seed the slot, then drive
  it from a source." Recognized structurally (`'from' in input`); Channel is
  just one implementer.
- One live source per anchor: a new subscribe supersedes the prior; a swap
  (`clear`) cancels the live source (WeakMap anchor → cancel, with a
  reentrancy guard so a source's own value doesn't self-cancel).
- Errors: bare sources are fire-and-forget — errors are unhandled by design.
  Handled errors are Channel's job (`error` prop). Compose is a rendering
  surface; an error must be resolved into something renderable.

### create — component position (`compose/compose.js`)

- Constructible things only: class / `function(){}` → `new C(props,
  childNodes)`; arrow → called `(props, childNodes)`; object with
  `render()` → `initialize?.(props, childNodes)` then kept as the instance.
- `null`/`undefined` → render nothing (conditional `<C/>`). Primitives and
  Nodes in component position THROW with pointed messages (a pre-built Node
  is a value: `{node}`, not `<Node/>`).
- JSX invocation always passes a props object (`{}` when empty —
  destructuring-safe); direct calls pass exactly what you give them.
- childNodes (second arg) = the component's JSX content, COMPOSED — fully
  resolved DOM, opaque; compose by nesting, don't introspect. (Open
  consideration: `create` instead of `compose` for childNodes, so a parent
  could receive live UIComponent instances.)

### renderer / rerenderer (`renderer/rerenderer.js`)

- `renderer(fn)` — fresh: ignores site cache, never skips, never memoizes.
  The RESET — pushed to shadow an outer rerenderer at a frame boundary.
- `rerenderer(fn)` — re-execution against a cache keyed by SITE IDENTITY
  (not call order — control flow just works). Same nodes come back, rebound.
  Sites are occurrence-indexed per pass: lists shrink (truncate to cursor),
  branches sleep (retained). Anchor memo: composing the identical value is
  one instruction, not two (`===` skip).
- Component update verb (`composeComponent` under a rerenderer): same
  Constructor at an anchor → `instance.update(props, childNodes)` in place;
  different Constructor → replace. Plain functions re-invoke their cached
  chain end (setup re-fires — the documented cost).

### below the line (`channels/`, `lists/`)

- **Channel** — one class, two roles: JSX component `<Channel source as
  error map append eventType>` and Input implementer (`initial`/`from`/
  `append`). Subscription is lazy (first pull); a source switch aborts the
  old subscription promptly. `channels/channel.js`
- **pushable** — `[asyncIterator, push]`: the bridge from push/callback APIs
  to pull iteration. Single-consumer; no transforms. `channels/pushable.js`
- **KeyedList** — pure-platform custom element (KeyedUList/KeyedOList/
  KeyedTable): a new render frame out of the forward-only flow. Ops keep the
  delta (add/addAll/insert/update/move/remove/clear); per-row rerenderer —
  `update(key, data)` rebinds in place. `lists/KeyedList.js`
