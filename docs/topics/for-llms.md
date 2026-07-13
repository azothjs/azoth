# For LLMs — working in this repo

**Writing application code that uses azoth?** The consumer guide is
[`packages/azoth/llms.md`](../../packages/azoth/llms.md) — self-sufficient,
and it ships in the npm package (`node_modules/azoth/llms.md`). Read that,
not this.

This page is for working **on azoth itself** — the repo's own code, tests,
and docs.

## The single most important fact

**JSX evaluates to actual DOM.** `<p>hello</p>` returns an
`HTMLParagraphElement`. Everything in this repo — compose's dispatch, the
rerenderer's site cache, the anchor bookkeeping — is a consequence of that
fact. See [jsx-as-dom.md](jsx-as-dom.md).

## Verify, don't speculate

The repo is built so behavior questions have runnable answers:

- **Author-level behavior**: the valhalla suite —
  [`packages/valhalla/index.md`](../../packages/valhalla/index.md) maps
  topic → test file; the test code is the example, the frozen expectation
  is verified output.
- **Quick experiments**: `packages/valhalla/sandbox.test.tsx` — paste JSX,
  run (`pnpm vitest run packages/valhalla/sandbox.test.tsx`), read the
  output.
- **Mechanism-level rules**: the maya unit suite
  (`packages/maya/compose/*.test.js`) — including the empirical-probe genre
  (`compose.cascade.test.js`, `compose.clear.test.js`) that pins what the
  runtime actually does.
- **Compiled output**: `packages/thoth/compiler.test.js` shows exactly what
  any JSX compiles to.

Don't claim a behavior without grounding. If you're guessing, say so.

## Repo conventions that will bite you

- **Inline snapshots**: expected values are frozen generated output
  (`.toBe`/`.toEqual`) — never hand-computed, and never trust `-u` in
  browser mode (the updater mis-writes; see TODO's vitest items and
  valhalla's README for the probe-harvest workflow).
- **Single-line JSX in tests** — multi-line children create whitespace text
  nodes that pollute HTML expectations. Attribute-position breaks are safe.
- **`<!--az:N-->`** is the slot anchor (N = nodes owned); `data-bind` marks
  bound elements — see valhalla's README, "Reading the snapshots".

## Surface confusion

If something confuses you, there's a good chance it's underdocumented or a
real wart. Surface it — that signal is valuable here.

## Reading order (repo work)

1. [`docs/design/core-rules.md`](../design/core-rules.md) — the rule map
   with file pointers
2. [`packages/valhalla/`](../../packages/valhalla/index.md) — the rules as
   tests
3. [Frames](frames.md) — the concept azoth owns
4. `docs/design/` — decision records (rerenderer, keyed-list,
   attributes-and-properties, frame-primitives)
5. [`TODO.md`](../../TODO.md) — what's open, what's deliberately deferred
