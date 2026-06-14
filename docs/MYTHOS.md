# The Azoth Mythos

A history of the ideas, with receipts. Azoth is not a reaction to modern
frameworks — it is the completion of a proposal the ecosystem absorbed
by half. The other half is this repo.

## Timeline

**2013–14 — Ractive.** Marty Nelson and Rich Harris co-maintain
RactiveJS, Svelte's acknowledged predecessor. Templates as the unit of
thought, a decade before it was fashionable.

**~2015–16 — the `diamond-alpha` branch.** Tagged template literals as
the authoring surface, `<# … #>` interpolation blocks, components as
classes with static templates:

```js
static template( Todo, AddNew ) {
    return (todos) => $`<ul>
        <# todos.map( (todo, i) => { … }) #>
    <ul>`;
};
```

The lane is already visible: author in declarative templates, compile
away the framework.

**2017 — named Azoth.** Still framed as a state-management library. The
`2017-work` branch carries the empirical research that grounds
everything after: `research/javascript-dom/` micro-benchmarks —
`clone-template-vs-fragment`, `multi-clone`, `index-vs-selector`,
`class-vs-closure`, `array-vs-hash`, `sparse-arrays`. The platform was
measured before it was trusted.

**2019-11-11 — the gist and the issue.** Marty publishes
["AoT Template Extraction"](https://gist.github.com/martypdx/96b0a0900d2769a982ba36a066c1e38a)
(which already references azoth code). Hours later, Rich Harris opens
[sveltejs/svelte#3898 "More efficient fragment creation"](https://github.com/sveltejs/svelte/issues/3898):

> "This suggestion came from @martypdx, who co-authored Ractive
> (Svelte's predecessor)"

The gist contains both halves of the proposal:

- **(a)** "Faster mechanisms like `cloneNode` can be used to produce
  cheaper copies"
- **(b)** "For production bundling this should go into the html page
  itself with a unique id."

**2020-06-09 — defending half (b)** in the issue thread, replying to
Ryan Carniato:

> "The goal is to move the html creation out of js land and into the
> browser load. No innerHTML, no JS to parse and evaluate. Just let the
> browser load html in template tags. I think this is the part of the
> approach people are missing here. **No JavaScript will always be
> faster than some JavaScript.**"

**Winter 2023 — the JSX conversion.** A conversation with Ryan Carniato
on the SolidJS Discord: JSX tooling support is so broad that authoring
in JSX beats maintaining a tagged-template-literal toolchain. Azoth
keeps its compile-away thesis and switches its authoring surface to
JSX. (The framework remains: JSX as DOM literals — not React semantics.)

**2024-01-10 — core Azoth, and the lineage of the names.** The day Marty
writes core Azoth, he forwards a piece of lore he'd gotten from the source
years before: *why DOM events are lowercase.* Around 2015–16 — the same
window as the `diamond-alpha` template work above — he had asked Brendan
Eich, on Quora, "What is the origin of lower casing DOM object events and
event methods?" The platform instinct was forming on two fronts at once:
compiling *to* the platform, and asking *why the platform is the way it is.*
The creator of JavaScript answered:

> "I imitated HyperCard event names, e.g. click (Used with the `on`
> keyword: `on click …` in HyperTalk). … JS followed Java, which followed
> Smalltalk, in using camelCaps for method names and StudlyCaps for
> 'class names'." — /be

HyperTalk wrote handlers as `on mouseUp / play "boing" / end mouseUp`
(HyperTalk Beginner's Guide, p.96) — the word after `on` already lowercase.
The leap to a fully-lowercase `onmouseup` is the aesthetic Marty traces on
Stack Overflow (2021): `onmouseUp` "isn't so hot," so the all-lowercase
start carried through the whole name.

It is not incidental that this surfaces at Azoth's birth. Azoth treats the
platform's own names as authoritative — events are `node.onclick`
(lowercase, because Eich liked the look of HyperCard's `on mouseUp`), not
React's invented `onClick`. The same instinct runs through the
attribute/property split — `class` the markup attribute, `className` the
DOM property — and through making azoth, not a React-shaped library, the
authority on the DOM API (see `docs/design/attributes-and-properties.md`).
Use the platform's names, sourced from the platform, traced to the people
who chose them. The receipts go back to the creator.

And HyperCard is more than where the names came from — it is the
**hypermedia ancestor.** The "return to the platform" runs deeper than
DOM-API spellings: at bottom it is hypermedia — markup as the source of
truth and the medium of interaction (the delta model of
`docs/hypermedia.md`, not `ui = fn(state)`). It is the model htmx
re-articulated for the modern web — the truth worth crediting, distinct
from the implementation (azoth is a compile-to-platform JS client, not
HTML-over-the-wire). The names are the surface; hypermedia is the current.

**2023-09 → 2024-10 — Svelte 5 adopts half (a).** Template strings +
`cloneNode`, four to five years after the proposal. The floor rises;
the innovation becomes commodity.

**2024-02-02 — half (b) closed, not understood.** Marty asks whether
Svelte 5 will include the bundle-templates-into-html option. Response:
"It's not exactly clear what you're referring to… I'm going to close
this issue as completed." Marty replies with the concrete example —
`$.template(...)` vs `$.templateById('abc123')` — "shame to stop
there." No response.

**2026 — Azoth 2.0 ships half (b).** The vite plugin injects
`<template id="…">` elements into the served HTML page. The browser
parses them at load — no innerHTML, no JS parse of markup, static
content present before any script runs (no FOUC).
`DOMRenderer.getById(id)` in maya is, line for line, the
`$.templateById('abc123')` from the 2024 comment.

## The pattern

Innovation raises the floor of what is commodity. Half (a) was
innovation in 2019 and is table stakes in 2025 — the largest compiler
framework absorbed it. Half (b) — the more platform-aligned half —
remains unclaimed, and it is Azoth's differentiation today.

Azoth is built to keep riding that cycle: its TODO maintains a list of
its own code the platform is expected to absorb (iterator helpers will
absorb Channel's transforms; `EventTarget.when()` will absorb the
event bridge; DOM Parts may someday absorb the compiled binders). Most
frameworks defend their abstractions, because the abstraction is the
moat. Azoth maintains a deletion calendar.

## Receipts

- Gist: https://gist.github.com/martypdx/96b0a0900d2769a982ba36a066c1e38a
- Issue: https://github.com/sveltejs/svelte/issues/3898
- Tagged-template era: `diamond-alpha` branch of this repo
- 2017 platform research: `2017-work` branch, `research/javascript-dom/`
- Half (b), shipped: `packages/vite-plugin` (template injection),
  `packages/maya/renderer/dom-renderer.js` (`getById`)
- Naming lineage, from the source — Brendan Eich on the origin of lowercase
  DOM events (answer requested by Marty Nelson):
  https://www.quora.com/What-is-the-origin-of-lower-casing-DOM-object-events-and-event-methods
- The HyperTalk → `onmouseup` trace, documented:
  https://stackoverflow.com/questions/67506981/why-are-javascript-event-names-all-lowercase
