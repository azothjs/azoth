# Azoth

> JSX, evaluated to actual DOM. The platform was already enough.

Azoth is a JSX framework where `<p>hello</p>` returns an actual
`HTMLParagraphElement`. No virtual DOM. No reconciliation. No render cycle.
JSX compiles to template-clone + property-assignment; what you build on top
is plain DOM and plain JavaScript.

This is the single-install umbrella: it re-exports the runtime
([`@azothjs/maya`](https://www.npmjs.com/package/@azothjs/maya)) and bundles
the compiler + Vite plugin
([`@azothjs/thoth`](https://www.npmjs.com/package/@azothjs/thoth)).

## Install

```bash
npm install azoth
# or
pnpm add azoth
```

Configure Vite (`vite.config.js`):

```js
import { defineConfig } from 'vite';
import azoth from 'azoth/vite-plugin';

export default defineConfig({
    plugins: [azoth()]
});
```

`.jsx` and `.tsx` files are handled automatically.

## A quick taste

```jsx
import { Channel } from 'azoth';

const Greeting = ({ name }) => <p>Hello, {name}!</p>;

const App = () => (
    <main>
        <Greeting name="world" />
        <ul><Channel source={fetchItems()} map as={i => <li>{i.title}</li>}>
            <li>loading…</li>
        </Channel></ul>
    </main>
);

document.body.append(<App />);
```

That's the whole shape: components return DOM, async values go directly into
`{…}` slots, the DOM is what changes.

## Entry points

| Import | What it is |
|---|---|
| `azoth` | The author surface — `Channel`, `pushable`, `rerenderer`, `renderer`, keyed lists |
| `azoth/vite-plugin` | The Vite plugin (compiles JSX, extracts templates into your `.html`) |
| `azoth/runtime` | Compiled-output surface — imported by generated code, not by you |
| `azoth/jsx.d.ts` | JSX type definitions for TypeScript/TSX |

## Using AI?

The package ships a self-sufficient guide for AI assistants:
[`llms.md`](./llms.md) (`node_modules/azoth/llms.md` in your project).
Point your agent at it before writing azoth code.

## Learn more

- [Repository + docs](https://github.com/azothjs/azoth) — topics, design
  records, and the conformance suite
- [The rules, as runnable tests](https://github.com/azothjs/azoth/tree/main/packages/valhalla)
  — the test code is the example, the frozen expectation is verified output

MIT © Marty Nelson
