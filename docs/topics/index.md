# Topics

Author-facing docs. **The core rules live as tests** — start at
[`packages/valhalla/index.md`](../../packages/valhalla/index.md): the test
code is the example, the frozen expectation is verified output. The
maintainer-facing rule map is
[`docs/design/core-rules.md`](../design/core-rules.md). These topic files
carry what tests can't: the reframe, the concepts, practice, transitions.

## Foundations

- [JSX as DOM](./jsx-as-dom.md) — the foundational reframe;
  `<p>hello</p>` is real DOM
- [Components](./components.md) — function and class forms; component =
  constructor; props and childNodes

## Concepts

- [Hypermedia](./hypermedia.md) — events as deltas; layout management,
  not state management
- [Frames](./frames.md) — the forward-only flow, its seams, and KeyedList

## Practice

- [Workflow](./workflow.md) — UI-first methodology; mode shifts;
  step-size discipline
- [Authoring style](./authoring-style.md) — naming conventions, file
  structure, data ownership
- [Build and integration](./build-and-integration.md) — Vite plugin
  setup; esbuild pre-pass; HMR

## Transitions and limitations

- [Coming from React](./coming-from-react.md) — translation bridge for
  React developers
- [Known limitations](./known-limitations.md) — current bugs and
  foot-guns reference

## Internals

- [Thoth compiler](./thoth-compiler.md) — what JSX compiles to; template
  extraction; the three generators

## For AI collaborators

- [For LLMs](./for-llms.md) — terminology discipline; stop-and-ask
  triggers; verify-don't-speculate

## Reading order

1. [JSX as DOM](./jsx-as-dom.md)
2. [`valhalla/compose.test.tsx`](../../packages/valhalla/compose.test.tsx) —
   the `{…}` slot rules, as runnable examples
3. [Components](./components.md)
4. [`valhalla/channels.test.tsx`](../../packages/valhalla/channels.test.tsx) —
   async sources and `<Channel>`
5. [Frames](./frames.md) — when the forward-only flow needs a seam
6. [Workflow](./workflow.md) — when ready to build
7. The rest as questions arise

Mechanics prose this directory used to carry (composition,
async-and-channels, attributes-and-properties, maya-runtime, typescript)
is archived in [`docs/history/`](../history/) — superseded by the valhalla
suite, which can't drift. For deeper origin context, see
[`MENTAL-MODEL.md`](../history/MENTAL-MODEL.md).
