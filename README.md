# Azoth

> JSX, evaluated to actual DOM. The platform was already enough.

Azoth is a JSX framework where `<p>hello</p>` returns an actual
`HTMLParagraphElement`. No virtual DOM. No reconciliation. No render cycle.
JSX compiles to template-clone + property-assignment; what you build on top
is plain DOM and plain JavaScript.

Status: active development. Used in production at [Works Real
Estate](https://github.com/worksrealestate) and adjacent projects. The repo
is being organized for open-source release.

## Start here

- [Mental model: JSX as DOM](docs/topics/jsx-as-dom.md) — the foundational
  reframe
- [For LLMs](docs/topics/for-llms.md) — terminology discipline and
  stop-and-ask triggers when working with Azoth via AI
- [Workflow](docs/topics/workflow.md) — UI-first methodology that emerged
  from production
- [Coming from React](docs/topics/coming-from-react.md) — translation bridge
  for React developers
- [Full topic index](docs/topics/) — all curated reference docs

For the longer reasoning trace (an LLM working through Azoth for the first
time and corrected over many sessions), see
[`docs/MENTAL-MODEL.md`](docs/MENTAL-MODEL.md). The topic files in
`docs/topics/` are the curated surface; the mental-model document is the
origin.

## Packages

| Package | Role | Status |
|---|---|---|
| [`azoth`](packages/azoth) | Umbrella package; re-exports chronos, maya, vite-plugin | published |
| [`@azothjs/thoth`](packages/thoth) | JSX compiler — extracts HTML, generates targets + bind + renderer | DOM target complete; HTML/SSR target in progress |
| [`@azothjs/maya`](packages/maya) | Runtime — compose, blocks, renderer, replay bindings | DOM complete; HTML target in progress |
| [`@azothjs/chronos`](packages/chronos) | Lightweight async-generator factories — `generator()`, `reduce()`. No rendering coupling. | beta |
| [`@azothjs/vite-plugin`](packages/vite-plugin) | Vite integration with `.tsx` support via esbuild pre-pass | published |
| [`jsonic`](packages/jsonic) | Streaming JSON parser (used by chronos) | alpha |
| [`valhalla`](packages/valhalla) | API-level integration tests; also serves as worked-example reference for LLMs | active, private |

## Projects

| Project | Purpose |
|---|---|
| [`sandbox`](sandbox) | Developer scratchpad |
| [`test-utils`](test-utils) | Common test helpers |
| [`vite-test`](vite-test) | End-to-end Vite pipeline smoke test |
| [`docs`](docs) | Vitepress documentation site |

## Install

```bash
npm install azoth
# or
pnpm add azoth
```

Then configure Vite (`vite.config.js`):

```js
import { defineConfig } from 'vite';
import azoth from '@azothjs/vite-plugin';

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
[components](docs/topics/components.md),
[composition](docs/topics/composition.md), and
[async and channels](docs/topics/async-and-channels.md) for the full model.

## Status and roadmap

Active development. Multiple production deployments. The OSS release work in
progress includes:

- Documentation reorganization (current — this `docs/topics/` directory is
  the result)
- API stabilization (some renames pending — see [`TODO.md`](TODO.md))
- HTML/SSR target completion (Thoth + Maya have the abstraction; the HTML
  renderer is being filled in)
- Channel API consolidation

See [`TODO.md`](TODO.md) for the in-flight list.

## License

MIT — see [LICENSE](LICENSE).
