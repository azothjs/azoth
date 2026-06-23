# VirtualList (name TBD) — recycled-pool / virtualized list

> Status: FUTURE, separate block. Notes parked while designing
> [KeyedList](../../packages/maya/lists/KeyedList.js). Not started.

The second list strategy from the 2026-06-17 TODO decision. Distinguished
from `KeyedList` by **node lifecycle**, not by a config flag — so it's a
*distinct block*, not a mode toggle on KeyedList.

## The shape

- **K nodes ≪ N items.** Keep a bounded pool of K row nodes; rebind that
  pool to a data *window* as the user scrolls. N can be huge; the DOM only
  ever holds ~K rows.
- **Paint-dodge for offscreen rows:** `content-visibility` (the modern,
  honest form of the old `display:none` / offscreen trick).

## Why it keys differently from KeyedList

This is where the two blocks genuinely diverge, and it justifies the split:

- **KeyedList keeps per-row JS state** (a rerenderer per row), so identity
  lives in JS — a `Map<key, …>`. Location is O(1) in memory; the block
  never reads the DOM. (The "#1 — key from data" decision.)
- **VirtualList has no per-row JS state** — the pool *is* the state, and a
  pooled node's identity changes every time it's rebound to a new data row.
  Here the DOM genuinely *is* the source of truth, so querying it (the
  "#2 — key from markup" approach) is the *right* tool, not a round-trip.

So the keying argument we rejected for KeyedList is exactly the one that
belongs here. Document-as-source-of-truth shines when there's no JS state
to hold; that's this block, not the primary one.

## Open questions (when picked up)

- Scroll → window mapping: fixed row height (cheap) vs measured/variable.
- Pool sizing: K = viewport rows + overscan margin; how much overscan.
- Does it share KeyedList's `map` (row render fn) contract, or its own?
- Name. `VirtualList`? `WindowedList`? `RecycledList`? TBD.
