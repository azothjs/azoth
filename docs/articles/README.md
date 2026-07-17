# Articles

Outward-facing writing — the public argument for Azoth, in Marty's voice.
Drafting happens here; publishing is a copy-out. Convention: **every code
snippet in an article is verified** — it runs in
[`packages/valhalla/article-examples.test.tsx`](../../packages/valhalla/article-examples.test.tsx)
against real output before it ships.

## The series

1. **[JSX for the Web Platform](./jsx-for-the-web-platform.md)** — the core
   mechanics of replacing modern frameworks with hypermedia. The subtraction
   hook, the compile walkthrough, layout management (`uiₙ = uiₙ₋₁ + Δ`), the
   opt-in ladder (render now → later → again), the call-site/call-order
   coin, "the two moments." *Status: draft — core complete through the
   series hand-off.*

2. **Enhanced composition** *(planned)* — functional components, the
   UIComponent update protocol, the Input shape, and web components: who
   owns the update. The component ladder, re-subjecting via `update()`,
   frames (own intake + structural self-management), KeyedList and
   controllers. Source material: [topics/frames.md](../topics/frames.md),
   [topics/components.md](../topics/components.md).

3. **Using AI with Azoth: leaning into the corpus** *(planned)* — the
   era-of-AI spine: code is cheap, cookie-cutter is commodity,
   expressiveness and control are the differentiator; what you build is
   what you feed the model. Terminology navigation (push from the
   subtracted, pull to the unlocked), the verified-examples receipts story.
   Source material: [topics/for-llms.md](../topics/for-llms.md), the
   CascadiaJS talk (subtract→unlock).

Parked: a performance piece against krausest's js-framework-benchmark
(waits on the harness — see TODO). Candidate fourth piece: demo-led for
design engineers (see [launch.md](./launch.md)).

Launch operations — channels, cadence, prepared answers:
[launch.md](./launch.md).
