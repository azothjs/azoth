# Valhalla — the author-level conformance suite

Author-JSX → thoth → maya, verified in a real browser (vitest browser mode,
Chromium). The tests double as **worked examples for LLMs**: the test code is
idiomatic authored code, the frozen expectation is verified output. When you
need to know how azoth behaves, the test file is the documentation — start
from the topic map in [`index.md`](./index.md).

## Reading the snapshots

- **`<!--az:N-->`** — azoth's slot anchor. Every `{…}` slot compiles to a
  comment anchor; `N` counts the nodes the slot currently owns (`az:0`
  empty, `az:1` one value, `az:3` after an array of three). Content
  composes **before** its anchor; the anchor stays put across updates.
  The `az:` prefix is the trust boundary — authored comments in content
  are plain nodes to the runtime.
- **`data-bind=""`** — marks elements that carry compiled bindings (how
  generated target-selection finds them in a cloned template).
- **Whitespace is preserved.** JSX newlines/indentation become text nodes,
  so tests keep JSX inline (single-line) for clean input→HTML mapping.

## Conventions

- **Expected values are frozen generated output** — `.toBe('…')` for one
  stage, `.toEqual([…])` for a multi-stage `seq` array. Never hand-compute
  them; capture real output and freeze it. (The vitest inline-snapshot
  updater mis-writes in browser mode — multiple snapshots per test/file
  coalesce or land on the wrong call. See TODO.md "Vitest -u" items.)
- **One assertion per test** where possible; stages collect in a `seq`
  array asserted once.
- **Timing helpers**, not guesswork: `Promise.withResolvers()` so the test
  controls resolution; a `microtasks()` flush for promise chains; a
  `macrotask()` boundary for generator pipelines; fake timers for
  wall-clock delays.
- **Domain: Famous Cats** (felix, duchess, garfield, tom…) — distinct,
  colorful, traditional.
- **Idiomatic author code only** — no clever test devices an author
  wouldn't write. If a test needs scaffolding, the comment says why.

## TypeScript

Valhalla typechecks as `.tsx` (`pnpm --filter valhalla typecheck`, 0
errors) against `packages/azoth/jsx.d.ts` — `Composable` models everything
compose accepts. Use `as` assertions when a test drives DOM APIs on JSX
output (`<input/> as HTMLInputElement`). Remaining cast gaps (Observable
shape, `IGNORE`) are tracked in TODO.md; a cast in a test always carries a
comment pointing there.

## Running

```bash
pnpm vitest run packages/valhalla          # the suite
pnpm vitest run packages/valhalla/compose.test.tsx   # one topic
pnpm --filter valhalla typecheck           # types
```

`sandbox.test.tsx` is the empirical scratch space: paste JSX, run, read
the output. Verify, don't speculate — then move anything worth keeping
into the topic file it belongs to (see [`index.md`](./index.md)).
