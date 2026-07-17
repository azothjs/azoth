# **Thoth** - Azoth Compiler

<img src="https://raw.githubusercontent.com/azothjs/azoth/main/packages/thoth/thoth.webp" alt="Thoth the Azoth Compiler" width="224">

Thoth is the ancient god of writing and knowledge. Thoth gave the gift of hieroglyphic to the Egyptians and is credited as the author of science, mathematics, geometry, philosophy, medicine and magic.

As a compiler, thoth deduces all things through static analysis and the wisdom of the web spheres to produce highly optimized runtime code capable of amazing feats.

Thoth is the build-time half of [Azoth](https://github.com/azothjs/azoth) —
JSX for the web platform. Applications usually install the
[`azoth`](https://www.npmjs.com/package/azoth) umbrella package, which
bundles thoth's Vite plugin as `azoth/vite-plugin`.

---

## Technical Documentation

See [COMPILER.md](./COMPILER.md) for detailed documentation on:
- The compilation pipeline (parse → generate → output)
- Template extraction (HTML, comment nodes, data-bind markers)
- The three generators (targets, bind, renderer)
- Runtime integration with Maya
- Production vs development modes

## DOM resolution — `@azothjs/dom-info`

thoth owns codegen; every question about an element or a prop goes through
[`@azothjs/dom-info`](../dom-info), the DOM-API authority. Its purview is now
the whole platform surface, browser-validated against the pinned Chromium:

- **Tags** — HTML, SVG, and MathML are known; a lowercase, non-hyphen tag
  that isn't a platform element (`<foo>`) is a compile error.
- **Attributes** — validated per element (`href` on `<div>` errors); a static
  value is markup, a dynamic value is the DOM property.
- **Properties** — including property-only IDL names property-information
  can't see (`defaultValue`, `defaultChecked`).
- **Events** — `on*` must be a real DOM event, scoped per element (window
  handlers on `body`, media EME/PiP on `audio`/`video`).

Resolution is **strict by default**: a name that isn't a recognized platform
attribute/property/event on its element is a compile error with an educational
message, not a silent `setAttribute` expando. (Custom elements — tags with a
hyphen — and SVG/MathML elements aren't attribute-constrained yet.) A config
flag to relax unknown-name strictness is parked until a real need surfaces.
See [docs/design/attributes-and-properties.md](../../docs/design/attributes-and-properties.md).
