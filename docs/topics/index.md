# Topics

Curated reference docs for Azoth. Each topic file opens with a voiced
first-person reframe (the *insight*) followed by reference material in
neutral prose.

## Foundations

- [JSX as DOM](./jsx-as-dom.md) — the foundational reframe;
  `<p>hello</p>` is real DOM
- [Composition](./composition.md) — the `{…}` slot mechanic; the
  compose resolution chain
- [Components](./components.md) — function and class forms; component =
  constructor; props and slottable
- [Attributes and properties](./attributes-and-properties.md) — static
  vs dynamic; the class/className foot-gun; SVG limitations

## Async and updates

- [Async and channels](./async-and-channels.md) — promises, iterators,
  observables; `channel()` and the Channel pattern
- [Hypermedia](./hypermedia.md) — events as deltas; layout management,
  not state management

## Internals

- [Maya runtime](./maya-runtime.md) — compose, blocks, renderer; opt-in
  sophistication
- [Thoth compiler](./thoth-compiler.md) — what JSX compiles to;
  template extraction; the three generators

## Practice

- [Workflow](./workflow.md) — UI-first methodology; Phases 1–5; mode
  shifts; step-size discipline
- [Authoring style](./authoring-style.md) — naming conventions, file
  structure, design principles
- [TypeScript](./typescript.md) — type assertions; `JSX.Element = Node`;
  TSX support
- [Build and integration](./build-and-integration.md) — Vite plugin
  setup; esbuild pre-pass; HMR

## Transitions and limitations

- [Coming from React](./coming-from-react.md) — translation bridge for
  React developers
- [Known limitations](./known-limitations.md) — current bugs and
  foot-guns reference

## For AI collaborators

- [For LLMs](./for-llms.md) — terminology discipline; stop-and-ask
  triggers; sandbox-as-verification

## Reading order

If you're new to Azoth, this order works well:

1. [JSX as DOM](./jsx-as-dom.md)
2. [Composition](./composition.md)
3. [Components](./components.md)
4. [Async and channels](./async-and-channels.md)
5. [Workflow](./workflow.md) (when ready to build)
6. The rest as questions arise

For deeper origin context, see [`MENTAL-MODEL.md`](../MENTAL-MODEL.md) — the
longer reasoning trace this site was extracted from.
