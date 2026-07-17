# Launch — operating plan for the intro series

The distribution plan for the 2.x announcement series. Public on purpose:
these are real positions, prepared in the open — the same receipts culture
as the test suite. Strategy lives here; the articles carry the argument.

## Canonical home

Articles publish canonically as repo markdown (this directory). GitHub
blob URLs don't survive renames, so slugs freeze at publish — no `part-n`
prefixes; series membership lives in each article's intro and this
directory's README. When a later part ships, add prev/next links to the
bodies.

Cross-posts (Substack, dev.to) point home via canonical link. Substack's
job is converting the launch spike into subscribers who'll see parts ii
and iii.

## Channels, ranked

1. **Show HN** — the anchor event. The subtraction thesis is the lane
   htmx proved on HN; "every example runs in the test suite" is the
   receipt that crowd respects.
2. **JavaScript Weekly / Bytes** — submit the article; reaches more of
   the target audience than everything below combined.
3. **r/javascript** — a day or two after HN.
4. **htmx community** — `uiₙ = uiₙ₋₁ + Δ` is their lane; essays page and
   Discord.
5. **X / LinkedIn** — pointers to canonical. X's value is aligned voices
   amplifying, not the dormant account itself.

Design-focused people are a real second audience with a separate,
demo-led play — below.

## Show HN mechanics

- The title carries the **paradigm**, not the return type. DOM-returning
  JSX has prior art (jsx-dom et al.) — all runtime createElement-style;
  the compile-time story goes in the first comment, not the title.
- Working title:
  `Show HN: Azoth – JSX for the web platform: no vDOM, no state management`
- Link the repo (Show HN = something people can try); the first comment
  tells the story and links the article.
- Tue–Thu, ~7–9am Pacific, on a day with full comment availability —
  author presence is half of what makes a Show HN run.
- No traction → HN allows reposts after a while; second-chance pool via
  the mods.

## Cadence

Parts ii and iii each get their own launch, ~2–3 weeks apart.
Back-to-back same-project submissions read as marketing; the weekly
newsletters need a cycle to propagate; and part i's comment thread will
sharpen part ii — component/ownership questions are its exact material.
Past a month, continuity dies.

## Design engineers — the Coyier lane

Chris Coyier, ["JSX Without React"
(2023)](https://chriscoyier.net/2023/08/07/jsx-without-react/): "I think
it's perfectly reasonable to want to use the JSX syntax but not need
React. It's a decent templating language that I bet a lot of people are
quite comfortable with." His best client-side answer at the time was
Preact — still a vDOM, still hooks. Azoth is the actual ask: JSX, no
framework attached, real DOM out.

The play, after the HN launch:

- A short personal note to Coyier referencing the post — with a runnable
  demo, not just the article.
- Demos convert this audience; walkthroughs don't. StackBlitz starter
  (Vite runs in WebContainers; CodePen can't run the compile step).
- ShopTalk Show is the podcast channel for this exact conversation.
- Candidate fourth article: demo-led — View Transitions / GSAP / d3,
  "nothing owns the tree" as the pitch.

## Prepared answers

Positions for the questions the thread will ask. Prepared ≠ canned —
adapt to the actual comment.

### "How is this different from Solid / Svelte / Vue Vapor / lit-html?"

> Fair question — the no-vDOM space is crowded now, and getting more so:
> Solid, Svelte 5, and Vue's Vapor mode all compile away the virtual
> DOM. But all of them kept the other half: a reactive graph as the core
> primitive. You author state; the framework subscribes and projects
> it — `ui = fn(state)` with better mechanics. Azoth removes that layer
> without replacement. No signals, no subscriptions, no runtime
> ownership of the tree. Updates are events you wire: an async source
> feeding a slot (promise, stream, WebSocket, async generator), a
> rerenderer you call again, or plain DOM mutation. `uiₙ = uiₙ₋₁ + Δ` —
> and the Δ arrives already known, because it's the event.
>
> lit-html is the closest mechanically (templates + parts, per-call-site
> template identity), but it keeps the render entry point:
> `render(tpl, container)` re-evaluates and diffs part values each call,
> and the component model above it (LitElement) is
> reactive-properties-drive-re-render. Azoth has no re-render entry
> point — bindings are compiled ahead of time; values are applied, not
> compared.
>
> Prior DOM-returning JSX (jsx-dom et al.) is a runtime createElement
> walk. Azoth compiles the JSX away entirely: the HTML ships in a
> `<template>` your browser's parser instantiates; the JS that remains
> is property assignment. Every example in the article is frozen output
> from the repo's test suite.

### "Benchmarks?"

> Honest answer: no published numbers yet, so no performance claims. A
> js-framework-benchmark harness exists from an earlier iteration (~2
> years stale); rebuilding it against 2.x is on the roadmap, and the
> numbers get published when they're real, whatever they say. Two
> observations from the earlier round, offered as observations: the
> JS-time race at the top of that benchmark largely comes down to
> inlining and call-stack avoidance — azoth's earlier flat design was
> competitive there, and the current four-part decomposition trades some
> of that for the architecture that makes the model work. And script
> time is the smaller half of what users feel: the more interesting
> frontier is paint, where owning the DOM makes platform paint controls
> (`content-visibility`, containment) straightforward to apply.

### "This is jQuery spaghetti again"

> Azoth keeps what I'd argue are React's two great contributions: JSX,
> and unidirectional flow — data down, events up, changes requested as
> actions. What it drops is the machinery between them. The
> jQuery-spaghetti comparison comes up every time, so head-on: what made
> 2012 jQuery apps unmaintainable wasn't DOM mutation — it was
> *unstructured* mutation, any code touching any node, no way to trace
> what wired what. Azoth's answer isn't a reconciler, it's structure:
> updates land through declared channels at compiled binding sites,
> greppable at the call site. What React actually sells is a guarantee —
> UI ≡ f(state), always consistent — and the price is the render cycle,
> hooks rules, memo discipline, and effect lifecycles, paid on every
> change forever. The bet here: you already know when your data changes,
> because it's your event. Where you genuinely don't — collaborative
> editing, deep derived state — a projection model may earn its cost.
> That's the honest boundary of the claim.

### "Why isn't it written in TypeScript?"

> Two questions in there — can you use it from TS, and why isn't the
> source TS.
>
> Using it: yes. `.tsx` works out of the box (esbuild strips types,
> thoth compiles the JSX), the package ships `jsx.d.ts`, and the
> conformance suite is deliberately written in TSX and kept at zero
> typecheck errors — the TS consumer path is exercised, not assumed.
> Generated `.d.ts` for the runtime packages is on the roadmap.
>
> The source being JS is a choice, same lane as Svelte's JSDoc move.
> Partly history: when this started, TS in the toolchain was real build
> friction. Partly method: the design went through heavy churn before
> landing here, and structural typing mid-exploration is ceremony
> fighting discovery — you'd be typing shapes you're about to delete.
> And the correctness azoth actually leans on is behavioral, not
> structural: every rule in the model is a frozen, browser-verified
> expectation in the test suite. Types describe shapes; the suite pins
> what happens. You get both — types at the boundary, receipts
> underneath.

## Pre-launch checklist

- [x] Repo md sweep — `docs/history/` and known-limitations retired;
  README status honest (production use + CTO disclosure)
- [x] Article: single h1, sections downleveled
- [ ] `move-to-works-os-frontend/` deleted once confirmed landed in the
  works repo
- [ ] Issues: close #1 (obsolete) and #2 (resolved by the 2.x
  toolchain); comment on #4 (slot teardown landed in 2.0; author-facing
  cancel is the open half)
- [ ] Substack cross-post prepared, canonical link back to the repo
- [ ] StackBlitz starter for the design-engineer play
