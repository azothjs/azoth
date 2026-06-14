# Attributes and Properties — the platform-teaching model

Status: design settled (2026-06-13). Implementation pending: a compile-time
resolution table consumed by thoth's Analyzer + generators.

## Thesis: the split is the pedagogy

Azoth teaches the web platform. Its core compile decision — **static values
become part of the HTML template; dynamic values run as JavaScript** — is
not a hidden bundle/execution optimization. It *is* the lesson:

- **HTML markup** is the static layer — attributes present at clone time, in
  SSR, in a streamed / no-JS document. The default.
- **The DOM API** is the JavaScript layer — properties *and methods*, the live
  interface applied when JS evaluates.

"Build to HTML" is a return to the platform.

## The primary choice: the *syntax*, not the name

The author's first decision is the JSX syntax, and **that** picks the channel:

| syntax | layer | channel |
|---|---|---|
| `attr="value"` (static, quoted) | HTML template | **attribute** |
| `attr={value}` (dynamic, braced) | JavaScript | **property** |

The braces are the author's *declared intent*. `attr={"value"}` — a literal
string in braces — is still dynamic: JS-applied as a property, **not**
constant-folded into the template. (We are explicitly not doing esbuild-style
folding; the syntax is intent, not an optimization target.)

**The name then has to fit the chosen channel** — it does not pick it:

- static → an HTML **attribute** name: `class="qux"`.
- dynamic → a DOM **property** name: `className={x}`.

The name follows the syntax (markup vs JS); the syntax never follows the name.
`className` is not React vocabulary here — it is the real `Element.className`
IDL property, which is exactly what the dynamic (JS) channel sets.

## Where the alignment bends (quirks)

The bend is one-directional — **"has to be a DOM property"** — never the
reverse (a `{…}` value never lands in the HTML markup):

- **`NON_STATIC`** — `autofocus`, `muted`, `defaultValue`, `defaultChecked`:
  even a *static* value must be applied as a JS property (a cloned-template
  attribute won't take). A static value on these is promoted to a dynamic
  property assignment.
- **Property-less names** — `data-*`, `aria-*`, author-custom: a *dynamic*
  value has no property to set, so JS uses `setAttribute`. This is the only
  place a dynamic binding touches an attribute — via JS, never baked into
  markup. (It also fixes the `data-*` multi-word bug: no `dataset` round-trip.)

## The canonical teaching pattern

```jsx
<div class="qux" className={foo ? 'bar' : 'qux'}>
```

Both names, together, on purpose — and the *syntax* is what differs. `class="qux"`
is static → the cloned-template default (paints before JS, survives no-JS / SSR /
streaming). `className={…}` is dynamic → the JS-evaluated property update.
Progressive enhancement in the platform's own two layers. (Two names are
*required*: JSX can't repeat one attribute, and the two phases are genuinely
different operations.)

## Resolution

**Static (`="…"`)** → emit into the HTML template as the attribute, verbatim
name. Exceptions:
- a property-only name used statically (`className="x"`) → educational error
  (a static value belongs in markup as the attribute `class`).
- a `NON_STATIC` name with a static value → promote to a dynamic property
  assignment.

**Dynamic (`={…}`)** → apply through the DOM API. A DOM **property** is the
home base — the first stop for an attribute binding; `setAttribute` /
`setAttributeNS` / `toggleAttribute` are the platform-required *adjustments*
layered on where a property won't do. Resolving the name:
1. `on*` event → property assignment (`node.onclick = fn`). See Events.
2. SVG namespaced (`xlink:`, `xml:`) → `setAttributeNS`.
3. enumerated — `spellcheck`, `draggable`, `translate`, `autocorrect` →
   `setAttribute` with the string (NOT boolean: their value is the literal
   `"true"`/`"false"`, which a boolean property/presence would mis-coerce).
4. boolean attribute (the curated list) → boolean property / `toggleAttribute`.
5. a DOM **property** name → `node[prop] = x`. The author writes the property
   spelling: `className`, `htmlFor`, `tabIndex`, `readOnly`, the camelCase
   reflectors, plus live-state `value`/`checked`/`selected`/media. A *divergent
   attribute* spelling used dynamically (`class={x}`, `readonly={x}`) is an
   error (below) — it is **not** silently mapped to the property.
6. property-less (`data-*`, `aria-*`, custom, attribute-only) → `setAttribute`.

## What azoth rejects (educational errors)

Only **non-platform** names — the test is "is this a real attribute or a real
DOM property?", not "does React use it?". Errors teach in platform terms.

- **camelCase event handlers** — `onClick`, `onPointerDown` → error: the DOM
  event property is lowercase (`onclick`). React also renames events
  (`onDoubleClick` vs `ondblclick`) and changes semantics (`onChange`) — no
  safe translation, use the platform name.
- **static value on a property name** — `className="x"` → error: a static value
  is markup; use the attribute `class` (or `className={…}` for dynamic).
- **dynamic value on a divergent attribute name** — `class={x}`, `for={x}`,
  `readonly={x}` → error: a dynamic binding is a DOM property; use the property
  name (`className`, `htmlFor`, `readOnly`). Not silently mapped — the mismatch
  is taught, not hidden.

`className` / `htmlFor` / `tabIndex` (used dynamically) and `class` / `for`
(used statically) are **never** errors — they're the aligned forms.

## Why strict — the corpus is the product

Azoth's code is largely written by LLMs, and the corpus they produce teaches
the next model. That inverts the usual "meet authors where they are" instinct:

- **Liberal acceptance entrenches React-isms.** Silently mapping `class={x}` or
  accepting both spellings leaves React vocabulary and dual spellings in azoth
  code *permanently* — redundant structure a reader (human or model) must diff
  to confirm two trees mean the same thing. Lossy.
- **A clear error is a training signal.** It corrects toward the canonical
  platform name, and `for-llms.md` primes the model to write it right the first
  time — so errors are rare and the corpus *self-corrects* toward the platform.
- So **because** LLMs sling the code, strict wins: strict + docs is the virtuous
  loop (the corpus stays clean and teaches the platform); liberal is entropic
  (the corpus muddies and teaches React).

The mismatch is an error, not a silent fix, because **the error is the lesson.**

## Events

`onclick={fn}` → `node.onclick = fn` — a property assignment, not
`addEventListener`:

- **No subscription to manage** — nothing to tear down.
- **Idempotent under the rerenderer** — re-execution reassigns (replaces) the
  handler; `addEventListener` would *stack* a new listener every pass. Decisive,
  not just simpler.

Standard events have `on*` properties. Custom events and advanced needs
(capture, passive, once, multiple listeners) use the node directly:
`const el = <div/>; el.addEventListener('my-event', …)`. **No event
delegation** — that's a parallel system away from the platform.

## Components and custom elements

- **Components** (capitalized): props are author-named object keys with no DOM
  semantics. No table, no correction, ever.
- **Custom elements** (tag contains `-`): honor the literal name — kebab →
  attribute, valid-identifier → property. No convention-based kebab↔camel
  conversion (the element's own reflection is unknowable at compile time;
  runtime `in el` is timing-fragile and against WYSIWYG).

## Data source

Azoth owns the table (compile-time, no runtime dependency). The core is the
**attribute↔property reflection map** — `property-information` carries exactly
this (attribute name, property name, boolean/enumerated flags) — supplemented
by the framework constants (Solid `dom-expressions/constants.js`: booleans,
SVG elements/namespaces; Vue `shouldSetAsProp`: enumerated, force-attribute
quirks; Svelte `NON_STATIC_PROPERTIES`), validated against the `dom-info`
browser audit. Reflection rules live in spec prose, not IDL; the relevant
tables are ~40–80 names, so curated + audited beats generated.
