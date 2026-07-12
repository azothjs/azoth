# Articles

Outward-facing writing — the public argument for Azoth, in Marty's voice.
Drafting happens here; publishing is a copy-out. Convention: **every code
snippet in an article is verified** — it runs in
[`packages/valhalla/article-examples.test.tsx`](../../packages/valhalla/article-examples.test.tsx)
against real output before it ships.

## The series

1. **[JSX for the Web Platform](./jsx-for-the-web-platform.md)** — the intro.
   The subtraction hook, the compile walkthrough, layout management
   (`uiₙ = uiₙ₋₁ + Δ`), the opt-in ladder (render now → later → again), the
   call-site/call-order coin. *Status: core complete; closer (era-of-AI /
   differentiation argument) pending — see the notes at the file's end.*

2. **Who owns the update** *(planned)* — the component ladder: render
   function → UIComponent protocol → custom element; re-subjecting via
   `update()`; the frames concept (own intake + structural
   self-management); KeyedList and controllers; the intake gradient
   (exposed / injected / sealed). Source material:
   [topics/frames.md](../topics/frames.md),
   [topics/components.md](../topics/components.md).

3. **Patterns on top** *(planned)* — Azoth deliberately leaves multiple
   valid shapes ("it's just JavaScript"); patterns belong to the app layer,
   and that's the invitation. View/CardView, module-exports-a-Channel
   separation of concerns, controller recipes per source. Source material:
   [topics/workflow.md](../topics/workflow.md).

Parked until the harness exists: a performance piece against krausest's
js-framework-benchmark (see TODO — not a release gate).
