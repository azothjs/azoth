# Frames as a deferred primitive stance

A **frame** (a region that structurally manages its own interior, through
intake it defines — concept + recognition test:
[topics/frames.md](../topics/frames.md)) is an **unprivileged author pattern**:
KeyedList rides only the public `rerenderer` + platform, no maya internals; the
production `AnalysisChat` class carried the same pattern *before* KeyedList
existed, with no base class at all. So azoth doesn't have to pre-decide its
primitive set. What ships out-of-the-box is a deliberate, conservative choice;
everything else is a documented, replicable pattern. **Not a limit — an
invitation.**

## Two questions, kept separate

1. **Is it a frame?** Two conditions (the topic doc's test): **its own intake**
   — interior change flows through methods/ops/listeners the region defines,
   not the outer flow's channels (slot value, props, children) — and
   **structural self-management over time**. "Dynamic" is too vague — pin it by
   what is *not* one. **Tactical DOM work** — render initial DOM from a
   template, then imperatively set a prop or two on those existing nodes — is
   *not* a frame; it's a UIComponent (template render + a simple imperative
   update). Nor is anything reducible to **replaying the same data structure
   over the same templates** (the rerenderer already does that — array-replay /
   ordinal reuse, the loops case): efficient wiring is still wiring, on the
   outer clock. A frame is for **self-managing structural change over time**
   that none of those expresses — rows/views appearing, disappearing,
   reordering on their own clock. Architecture test.
2. **Should it ship out-of-the-box?** — **ubiquitous + low opinion-cost**
   (settled semantics, few defensible designs). Inclusion test. Most frames pass
   (1) and fail (2) → they're recipes, not core.

## The frame recipe (what authors replicate)

`extends HTMLElement` + `Map<key, rerenderer(view)>` (or whatever per-instance
state the frame needs) + imperative DOM ops + idempotent `define`. Public
`rerenderer` does the per-site DOM reuse; the element owns its cycle.

## Candidate landscape

| Pattern | A frame? | Ship OOTB? |
|---|---|---|
| **Keyed list** (KeyedList) | yes | **YES** — universal; list semantics are settled |
| **Virtualized list** (VirtualList) | yes (different node lifecycle) | likely — big-data is common; planned leaf |
| **Route outlet** (navigation → view swap) | yes | **strongest next case — but a `subtract` story, not a router (see note).** |
| Enter/leave **transitions** (coordinate removal with animation) | yes | recipe — common but opinionated; pairs with lists |
| **Portal / teleport** (managed placement elsewhere) | yes | recipe |
| Drag-**sortable** | yes | recipe — specialized; pairs with lists |
| **Infinite scroll** | yes | recipe — related to VirtualList |
| Tabs / accordion / **selection** | **no** — forward-only + CSS + a tiny imperative swap (see keyed-list's select discussion) | n/a |
| **Forms** | **no** — native + forward-only | n/a |
| Single **async value** | **no** — that's `Channel`'s job | n/a |

## On routing — no general problems, just app-layout decisions

A state-managed / render-tree router treats every navigation the same — or makes
you opt out with hacks. But the real question is an **app decision, per route**:
is the rendered view *preserved and reused*, or *recreated*? The frame model
makes that an explicit author choice — a kept element ref → reused; a fresh
element → recreated — not a framework default. So azoth ships (at most) the
**outlet frame** (the seam where a view swaps) and leaves the *routing strategy*
to the app. There are no general routing problems, just app-layout decisions —
*subtract to unlock*. (Proving ground: the first real app — a wre-dashboards →
works-os-frontend shell — features "router as LLM tool use," which exercises
exactly this.)

## The stance

Ship the ubiquitous-low-opinion few (the **list family**). Keep the frame
pattern first-class and documented so the ecosystem builds the rest. The
out-of-the-box set stays small (subtract); the pattern stays open (invitation).
Consistent with *be the ocean* — azoth provides the primitive (the public
`rerenderer` + the frame recipe); the platform and authors provide the variety.
The boundary is reviewed as real cases accrue: a pattern earns core status by
proving ubiquity *and* settled semantics, not by being possible.
