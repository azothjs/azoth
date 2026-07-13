# docs/history — origin & design artifacts

**Not current documentation.** For that, see [`docs/topics/`](../topics/) (the
guides) and [`docs/design/`](../design/) (the internals). What lives here is
kept for the *thinking*, not as guidance — some code samples use superseded
APIs.

- **`MENTAL-MODEL.md`** — the LLM's mental model of Azoth, written for review;
  the origin reasoning trace the topic docs were distilled from.
- **`MYTHOS.md`** — the history of the ideas, with receipts.
- **`hypermedia.md`** — the long-form hypermedia essay that
  [`topics/hypermedia.md`](../topics/hypermedia.md) distills.
- **`async-rendering-patterns.md`** — early async/render design exploration
  (some speculative component names never shipped; kept for the design lineage).

Archived 2026-07 (the tests-as-docs move): mechanics prose superseded by the
valhalla suite — the tests can't drift; these already had. The replacement is
`packages/valhalla/` (start at its `index.md`) plus
[`docs/design/core-rules.md`](../design/core-rules.md).

- **`composition.md`** → `valhalla/compose.test.tsx` (predates the uniform
  replace rule and the Input shape).
- **`async-and-channels.md`** → `valhalla/channels.test.tsx` +
  `compose.test.tsx`.
- **`attributes-and-properties.md`** → `valhalla/attributes.test.tsx`; the
  full resolution model lives in
  [`docs/design/attributes-and-properties.md`](../design/attributes-and-properties.md).
- **`maya-runtime.md`** → [`docs/design/core-rules.md`](../design/core-rules.md)
  (predates lists/KeyedList — still says "blocks").
- **`typescript.md`** → `valhalla/README.md` TypeScript section + the
  `jsx.d.ts` comments (predates the Composable union).
- **`scratchpad/`** — pre-topics exploratory drafts, moved wholesale.
- **`doc-review.md`** — the 2026-06 doc-refresh plan (catalog + two-track
  analysis). The analysis held; the delivery mechanism changed — the LLM
  track became the valhalla suite rather than more topic prose. Kept as the
  planning artifact.
- **`package-reorg.md`** — the completed package-reorganization plan
  (chronos/vite-plugin folded into maya/thoth; shipped 2026).
- **`keyed-list-transcript.md`** — the design-dialogue transcript behind
  [`design/keyed-list.md`](../design/keyed-list.md); the distilled decisions
  live there.
