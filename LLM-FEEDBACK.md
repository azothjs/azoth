# LLM Feedback on Azoth Docs

## Claude Fable 5 — llms.md @ 2.0.1 — 2026-07-13

**Context.** First blind consumption of `llms.md`: I read the 344-line doc once,
then wrote a complete new page in `works-os/frontend` — a streaming LLM chat
(SSE-parsed fetch body → DOM), an async data wrapper, a class component owning
its thread, conditional/list rendering, plus 8 jsdom tests — without opening
framework source or any other Azoth doc. Result: **zero compile errors, all
tests green on the first run.** The only non-`llms.md` reads were for *app*
conventions (file layout, service idioms), not framework semantics. As a
measure of whether the doc is self-sufficient for an agent: it is.

### What carried the weight (keep these)

- **"The one fact" first.** JSX-returns-real-DOM up top reframes everything
  downstream; every later rule reads as a consequence instead of a list item.
- **The two-moments model** ("initial render is a function call; an update is
  whatever channel you wired; there is no third moment"). This is the sentence
  that deletes the React reflex.
- **The catch-and-correct table.** I *did* reach for React vocabulary while
  planning ("re-render the bubble"); the table's translations are formatted
  exactly like an LLM's internal correction pass wants them.
- **The `Chat` class example.** It was nearly a blueprint for a real streaming
  chat page — held nodes + methods that mutate own DOM. Worked example >
  abstract rule; consider keeping one this substantial forever.
- **DO/DON'T as paired code lines** — cheap to memorize, easy to diff my own
  draft against.
- **"Azoth's errors teach" + compile-time dynamic-attr errors.** For an agent,
  a pointed compile error beats a silent no-op by miles — the feedback loop
  self-corrects in one iteration. Documenting the error *strings* is unusual
  and genuinely useful; more docs should do it.
- The **reading-rendered-HTML section** (`<!--az:N-->`, whitespace-as-text
  nodes) — exactly what test-writing needs; the whitespace warning saved me
  from brittle `textContent` assertions.

### Gaps I hit (each: what I needed → what I did → suggested fix)

1. **`Channel`'s `error` prop has no example.** It appears in the vocabulary
   line and one sentence ("for handled errors, use `<Channel error={…}>`"),
   but signature and semantics are unstated: function of the error? returns
   DOM? replaces the slot content or the initial children? I wrote
   `error={err => <p>…{err.message}</p>}` on faith and it worked — but faith
   is what this doc otherwise never requires. One example line in the Channel
   section closes it.
2. **Modern class syntax support is unstated.** Writing the class component I
   wanted `#private` methods and class fields, but couldn't tell whether the
   compiler parses them (the doc says the vite plugin compiles JSX — with what
   syntax ceiling?). I defensively used plain methods. One sentence in
   Components — "class bodies are standard JS; anything your target supports
   works" (or the actual constraint) — removes the hedge.
3. **`null` as an array *member*.** The slot rules say `null`/`undefined`
   render nothing as *values*, and "arrays: each member composes." I leaned on
   `items.map(...)` returning `null` for some members (kind-polymorphic list
   where unknown kinds render nothing) — it held, but I was extrapolating.
   Suggest making it explicit: "array members follow the same value rules
   (`null` members render nothing)."
4. **Micro-nit:** `import` line for `Channel` etc. appears mid-doc in the
   vocabulary section; I went looking for it once. A single consolidated
   "imports you'll actually use" line near the top would end the search.

### One meta-observation

The doc's restraint is its strength: 344 lines, no philosophy beyond what
changes code, and every claim testable against output. The moment I trusted it
was the compile error naming `className` — the doc had said errors teach, and
then one did. Whatever 2.x adds, keeping `llms.md` at "everything needed,
nothing else, most important first" is the property to defend.

*(Not evaluated this pass: KeyedList, rerenderer under real rerenders, the
Input shape beyond reading it, routing/frames — the demo page needed none of
them. Happy to run a second pass targeting those when there's code that wants
them.)*
