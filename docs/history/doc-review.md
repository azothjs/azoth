# Documentation review & refresh — plan

Catalog pass (2026-06): **29 docs — 18 current, 5 stale, 6 reference/meta.**
The teaching arc's first four levels are solid; the gaps + stale spots map onto
the reorg and the talk's framing.

## Two audiences, two tracks

- **Human track — the story.** Move the reader from **state-based** (inward
  gaze: code/tech) to **layout-based** (outward gaze: UX + value). Spine: the
  *"without ___"* hook (no vDOM / no controlling renderer / no JS creating DOM /
  no state) → **subtraction, not replacement** → state→layout. Target reader:
  someone who wants to build more compelling / differentiated web experiences.
- **LLM track — navigation + the teaching arc.** Navigate to the corpus the
  model already knows (DOM / JS / platform): push from the *subtracted* (vDOM,
  React vocab), pull to the *unlocked* (DOM API, full JS). Teaching arc, opt-in
  depth, each level independently useful:
  1. JSX as DOM
  2. Props & Attributes
  3. Async composition (promises, observables, async iterators, EventTargets) + Channel
  4. Rerendering (the rerenderer)
  5. **KeyedList + custom elements — the "new frame for layout"**
- **Balance per doc:** the hook is paid off by *how it works* — so foundational
  docs lead with **mechanism** (answers the curiosity); practice docs lead with
  **how to use**.

## Gaps (net-new, highest value)

1. **Level 5 — KeyedList + custom-element frames.** Shipped; no doc. The arc
   stops at async composition. → NEW `docs/topics/keyed-list.md` (or
   `dynamic-lists-and-frames.md`): when you need a frame (the recognition test),
   KeyedList authoring, the controller/source patterns.
2. **The subtraction spine.** The core reframe is scattered (lives partly in
   `coming-from-react.md`) with no standalone anchor. → NEW spine doc: the
   "without" hook → subtraction → state→layout. The **human-track entry point.**

## Currency (stale references to kill)

`channel()` → `<Channel>` · `blocks`/`KeyedBlock` → KeyedList · `Controller`/
`Updater` (gone) · `use()` · the old package set / chronos / sandbox /
standalone vite-plugin.
- Hotspots: `docs/topics/maya-runtime.md` (Channel + blocks sections),
  `docs/topics/async-and-channels.md`, scattered top-level docs.

## Prune (essay-form dupes, superseded by `docs/topics/`)

- `docs/ASYNC-PATTERNS.md`, `docs/async-rendering-patterns.md`, `docs/maya.md`,
  `docs/hypermedia.md` — essay versions of topic docs, now carrying old APIs →
  archive or merge the still-useful bits (e.g. View/CardView → `workflow.md`).
- `docs/scratchpad/*` — stale exploratory → archive.
- **Keep:** `docs/MENTAL-MODEL.md` (historical origin trace). **Assess:**
  `docs/MYTHOS.md` (philosophy — fold into the spine doc, or keep as-is).

## Target structure (`docs/topics/`)

```
Foundations
  subtraction / the-platform-bet   ★NEW — the human spine + the "without" hook
  jsx-as-dom                        (L1 · current)
  attributes-and-properties         (L2 · currency check)
  composition                       (the {…} slot · current)
  components                        (function / class = constructor · current)
Async & updates
  async-and-channels                (L3 · currency: <Channel>, not channel())
  rerendering                       (L4 · ensure standalone coverage vs maya-runtime)
  hypermedia                        (events as deltas — layout not state · current)
Dynamic & frames
  keyed-list                        ★NEW — L5 · KeyedList + custom-element frames
Internals    maya-runtime (currency) · thoth-compiler
Practice     workflow · authoring-style · typescript · build-and-integration
Transitions  coming-from-react · known-limitations
For-AI       for-llms (navigation; sandbox refs removed)
```

## Tackle order (each its own small PR)

1. **NEW: level-5 KeyedList / frames topic** — completes the arc; documents the
   shipped headline feature; freshest context now.
2. **NEW: subtraction-spine doc** — the human-track anchor + the "without" hook.
3. **Currency pass** — `maya-runtime`, `async-and-channels`, scattered refs.
4. **Prune** — the `docs/` essay-dupes + `scratchpad/`.
5. **Package READMEs** — maya stub, thoth's new role, valhalla.
6. **Re-knit navigation** — `docs/index`, `topics/index`, README "Start here" to
   the refreshed structure + the two tracks.
