# Frames as a deferred primitive stance

A custom-element **frame** (a self-managing render cycle out of the forward-only
flow — see [keyed-list](./keyed-list.md)) is an **unprivileged author pattern**:
KeyedList rides only the public `rerenderer` + platform, no maya internals. So
azoth doesn't have to pre-decide its primitive set. What ships out-of-the-box is
a deliberate, conservative choice; everything else is a documented, replicable
pattern. **Not a limit — an invitation.**

## Two questions, kept separate

1. **Is it a frame?** — dynamic + self-managing, *and* **not** reducible to
   "replay the same data structure over the same templates" (the rerenderer
   already does array-replay / ordinal reuse — the loops case). Architecture test.
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
| **Route outlet** (URL → view swap) | yes | **strongest next case — but evaluate, don't auto-ship.** Ubiquitous, but routing is high-opinion (nested routes, guards, data-loading). If anything, ship the *outlet* frame, leave the routing strategy to the author |
| Enter/leave **transitions** (coordinate removal with animation) | yes | recipe — common but opinionated; pairs with lists |
| **Portal / teleport** (managed placement elsewhere) | yes | recipe |
| Drag-**sortable** | yes | recipe — specialized; pairs with lists |
| **Infinite scroll** | yes | recipe — related to VirtualList |
| Tabs / accordion / **selection** | **no** — forward-only + CSS + a tiny imperative swap (see keyed-list's select discussion) | n/a |
| **Forms** | **no** — native + forward-only | n/a |
| Single **async value** | **no** — that's `Channel`'s job | n/a |

## The stance

Ship the ubiquitous-low-opinion few (the **list family**). Keep the frame
pattern first-class and documented so the ecosystem builds the rest. The
out-of-the-box set stays small (subtract); the pattern stays open (invitation).
Consistent with *be the ocean* — azoth provides the primitive (the public
`rerenderer` + the frame recipe); the platform and authors provide the variety.
The boundary is reviewed as real cases accrue: a pattern earns core status by
proving ubiquity *and* settled semantics, not by being possible.
