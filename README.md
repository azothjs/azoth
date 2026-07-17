# Azoth

> JSX, evaluated to actual DOM. The platform was already enough.

Azoth is a JSX framework where `<p>hello</p>` returns an actual
`HTMLParagraphElement`. No virtual DOM. No reconciliation. No render cycle.
JSX compiles to template-clone + property-assignment; what you build on top
is plain DOM and plain JavaScript.

Status: 2.0 is on npm and in production at [Works Real
Estate](https://github.com/worksrealestate). New in public — the honest
picture is under [Status and roadmap](#status-and-roadmap) below.

## Start here

- [Mental model: JSX as DOM](docs/topics/jsx-as-dom.md) — the foundational
  reframe
- [LLM guide](packages/azoth/llms.md) — the self-sufficient guide for AI
  assistants writing azoth code; ships in the npm package
  (`node_modules/azoth/llms.md`). Repo-work entry:
  [for-llms](docs/topics/for-llms.md)
- [Coming from React](docs/topics/coming-from-react.md) — translation bridge
  for React developers
- [Full topic index](docs/topics/) — all curated reference docs

## Packages

| Package | Role | Status |
|---|---|---|
| [`azoth`](packages/azoth) | Umbrella package; re-exports maya (runtime) + the Vite plugin | published |
| [`@azothjs/maya`](packages/maya) | Runtime — compose, the rerenderer, keyed lists, replay bindings | DOM complete; HTML target in progress |
| [`@azothjs/thoth`](packages/thoth) | JSX compiler (extracts HTML, generates targets + bind + renderer) + the Vite plugin (`@azothjs/thoth/vite`) + dom-info (internal DOM-API authority) | DOM target complete; HTML/SSR target in progress |
| [`valhalla`](packages/valhalla) | Conformance suite (author-JSX → thoth → maya); the core rules as tests — doubles as the worked-example reference for LLMs | active |

Two halves under one umbrella: **maya** is what runs in the browser, **thoth**
is what runs at build time (compiler + its Vite plugin + the internal dom-info
data). The `azoth` package is the single install that re-exports both.

## Projects

| Project | Purpose |
|---|---|
| [`test-utils`](test-utils) | Common test helpers |
| [`vite-test`](vite-test) | End-to-end Vite pipeline smoke test |
| [`docs`](docs) | Markdown docs: `topics/` (author-facing) · `design/` (maintainer decision records) · `articles/` (outward writing) |

## Install

```bash
npm install azoth
# or
pnpm add azoth
```

Then configure Vite (`vite.config.js`):

```js
import { defineConfig } from 'vite';
import azoth from 'azoth/vite-plugin';

export default defineConfig({
    plugins: [azoth()]
});
```

`.jsx` and `.tsx` files in your project are handled automatically. See
[build and integration](docs/topics/build-and-integration.md) for details.

## A quick taste

```jsx
const Greeting = ({ name }) => <p>Hello, {name}!</p>;

const App = () => (
    <main>
        <Greeting name="world" />
        <ul>{fetchItems().then(items =>
            items.map(i => <li>{i.title}</li>)
        )}</ul>
    </main>
);

document.body.append(<App />);
```

That's the whole shape: components return DOM, async values go directly into
`{…}` slots, the DOM is what changes. See
[components](docs/topics/components.md) for the component model — and for the
core rules as runnable examples,
[the valhalla suite](packages/valhalla/index.md):
[`compose.test.tsx`](packages/valhalla/compose.test.tsx) (the `{…}` slot),
[`channels.test.tsx`](packages/valhalla/channels.test.tsx) (async sources).

## Status and roadmap

Azoth 2.0 is on npm and runs in production at [Works Real
Estate](https://github.com/worksrealestate) — full disclosure: Azoth's
author is the CTO there, so that's a bet on our own stack, not independent
adoption. The API is stable as of 2.0, and the core is heavily specified:
every rule in the model is pinned by the [valhalla conformance
suite](packages/valhalla/index.md) — authored JSX through the compiler and
runtime, output verified in a real browser.

It is also new in public, which means fresh usage will find edge cases ours
hasn't. Two things keep that survivable. Azoth's surface area is
deliberately thin — for most "does X work with it?" questions (View
Transitions, d3, whatever ships next) the answer is "it's real DOM; use the
platform." And limitations get documented openly when found, not buried —
open an issue and it becomes part of the record.

In progress:

- HTML/SSR target (thoth + maya have the abstraction; the HTML renderer is
  being filled in)
- Generated `.d.ts` for maya/thoth (`jsx.d.ts` ships self-contained today)
- Benchmark harness (krausest js-framework-benchmark)

See [`TODO.md`](TODO.md) for the full in-flight list.

## Releasing

Maintainers: see [RELEASING.md](RELEASING.md) — changesets, one fixed
version train across the three packages.

## License

MIT — see [LICENSE](LICENSE).
