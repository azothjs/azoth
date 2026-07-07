# Build and integration

> **Azoth is a build-time tool that ships runtime helpers.** The compiler
> (Thoth) does the heavy lifting at build time; the runtime (Maya) is small
> and stays small. If you understand the build pipeline, you understand
> most of what makes Azoth practical to use.
>
> I came in looking for "the framework" — the runtime entry point, the
> bootstrap call, the loader. There isn't one. The framework happens in the
> bundler. Vite runs the Azoth plugin over your `.jsx` / `.tsx` files,
> Thoth rewrites them into template imports plus thin binding calls, and
> the result drops into a normal Vite build. The shipped JS imports a
> handful of runtime helpers and does what JS is good at: applying values
> to known positions.

## The integration layer

Azoth assumes Vite. The integration is a single plugin:
**`@azothjs/vite-plugin`** (verified in
`packages/vite-plugin/package.json`).

```js
// vite.config.js
import { defineConfig } from 'vite';
import azoth from '@azothjs/vite-plugin';

export default defineConfig({
    plugins: [azoth()]
});
```

That's the full setup for a JSX-only project. No further configuration is
required for the plugin to operate.

## What the plugin does

Per file matching `/\.[jt]sx$/`:

1. **Intercept** — the plugin's `transform` hook runs `pre`, before Vite's
   default JSX handling.
2. **(TSX only) Pre-strip TypeScript** — `.tsx` source is passed through
   esbuild with `loader: 'tsx'` and `jsx: 'preserve'`. Types are removed;
   JSX is kept intact.
3. **Compile** — Thoth parses the JSX (Acorn + acorn-jsx), extracts static
   HTML, and emits transformed JS that imports virtual template modules
   and calls into the Maya runtime.
4. **Collect templates** — each unique template is registered with the
   plugin; identical HTML and identical binding shapes are deduplicated
   across the whole program. See [thoth-compiler](thoth-compiler.md).
5. **Hand back to Vite** — the rewritten JS continues through Vite's
   normal pipeline (resolution, bundling, minification, HMR).

At `build` time, a second plugin (`azoth-inject-template-html`) walks the
final bundle and injects collected templates as inert `<template>` tags
into the emitted HTML files. That's how the static markup reaches the
browser.

## TSX support

Thoth uses Acorn, which doesn't parse TypeScript. The vite-plugin
pre-processes `.tsx` with esbuild before Thoth sees the source:

```js
if (id.endsWith('.tsx')) {
    const result = await esbuildTransform(source, {
        loader: 'tsx',
        jsx: 'preserve',     // critical: keep JSX for Thoth
    });
    source = result.code;
}
```

The `jsx: 'preserve'` flag is the load-bearing detail. esbuild *must not*
transform the JSX itself — it only strips type annotations. The JSX then
flows into Thoth, which owns the JSX-to-DOM transform.

For the canonical write-up, see
[packages/vite-plugin/TSX-SUPPORT.md](../../packages/vite-plugin/TSX-SUPPORT.md).

`.jsx` files skip the esbuild pre-pass entirely — they go straight into
Thoth.

## Type checking is separate

The vite-plugin does not type-check. Type-stripping is a build operation,
not a verification one. Run `tsc --noEmit` (or rely on the IDE) for type
checking, separately from the build.

The same source file is type-checked by `tsc` and compiled by Vite. The
two passes don't see the same intermediate output, but they see the same
input — so a `.tsx` file that's type-correct in your editor compiles
through Thoth correctly. See [typescript](../../packages/valhalla/README.md) for the type
story.

## Output

Standard Vite build artifacts:

- A JS bundle that imports a small set of Maya runtime helpers (`__c`,
  `__cC`, `__renderer`) and calls into generated `targets` / `bind` /
  `renderer` functions per template.
- HTML files with `<template id="…">` tags injected (one per unique
  template) below `<body>`.
- Standard asset handling — no special runtime loader, no custom
  scaffolding.

The page works because: (a) the templates are parsed by the browser as
part of loading the HTML, (b) the JS clones them at runtime via Maya.

## Development mode

HMR works as it does in any Vite project. The plugin's `transform` runs on
each changed file; templates are re-collected; Vite handles the module
reload. Nothing Azoth-specific to configure.

In dev mode, templates are emitted with their HTML content embedded in
the generated module (so the browser can mount them on first run). In
build mode, the HTML is hoisted into the page's `<template>` tags and the
generated module ships without inline HTML — that's the
`noContent: isBuild` branch in the plugin source.

## Other build tools

Not currently supported. Azoth assumes Vite for now.

The plugin architecture is small (one transform hook, one bundle hook),
so adapting to other bundlers — Rollup directly, esbuild, Rspack — is
plausible. It hasn't been done. If you need it, the existing plugin in
`packages/vite-plugin/index.js` is a reasonable starting reference.

## Foot-gun: don't combine with a generic JSX plugin

Do not run a React Babel plugin, `@vitejs/plugin-react`, or any other
generic JSX transform alongside the Azoth plugin. They'll fight over the
JSX transform — the other plugin will rewrite `<p>hi</p>` into
`React.createElement('p', null, 'hi')` before Thoth gets to it, and the
Thoth pipeline will see no JSX to extract.

**The Azoth plugin owns JSX compilation.** If JSX is going through Vite,
only Azoth should be touching it.

The workspace's own `vite.config.js` explicitly tells esbuild to ignore
JSX/TSX files for exactly this reason:

```js
esbuild: {
    exclude: ['**/*.jsx', '**/*.tsx'],
}
```

## What this is *not*

Subtraction frame — things that simply aren't part of the integration:

- No runtime loader / bootstrap call (no `Azoth.start()`, no
  `mount(<App/>, root)`)
- No babel preset
- No webpack config
- No custom JSX pragma to configure (`/** @jsx … */` is irrelevant — the
  plugin owns the transform)
- No SSR setup yet — the renderer abstraction is in place but the
  string-renderer is in progress; see
  [maya-runtime](../design/core-rules.md)

## See also

- [Thoth compiler](thoth-compiler.md) — what the plugin runs inside
  `transform`
- [TypeScript](../../packages/valhalla/README.md) — the type-checking layer that runs
  alongside the build
- [For LLMs](for-llms.md) — terminology discipline; the build is where
  most of the "framework" lives
- [packages/vite-plugin/TSX-SUPPORT.md](../../packages/vite-plugin/TSX-SUPPORT.md)
  — canonical TSX deep-dive
