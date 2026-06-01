---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: Azoth
  text: JSX as DOM
  tagline: No&nbsp;virtual&nbsp;DOM. No&nbsp;reconciliation. No&nbsp;render&nbsp;cycle. The&nbsp;web&nbsp;platform&nbsp;was&nbsp;already&nbsp;enough.
  image:
    light: /azoth-logo-black.svg
    dark: /azoth-logo-white.svg
    alt: Azoth
  actions:
    - theme: brand
      text: Mental model
      link: /topics/jsx-as-dom
    - theme: brand
      text: Browse topics
      link: /topics/
    - theme: alt
      text: GitHub
      link: https://github.com/azothjs/azoth

features:
  - title: JSX returns real DOM
    details: <code>&lt;p&gt;hello&lt;/p&gt;</code> evaluates to an <code>HTMLParagraphElement</code>. The expression is the element. Standard DOM APIs work directly, immediately, without ceremony.
    link: /topics/jsx-as-dom
    linkText: How it works
  - title: Async drives layout
    details: Promises, async iterators, streams, observables go directly into JSX child slots. Each value is the next DOM. Layout management, not state management.
    link: /topics/async-and-channels
    linkText: Channels & async
  - title: Components are constructors
    details: Functions and classes both. The component runs once, returns DOM, manages instance state via closures or methods. The platform constructs, used directly.
    link: /topics/components
    linkText: Components
  - title: Plain JavaScript, plain DOM
    details: No proprietary state primitives. No synthetic events. No framework boundary. Bring any browser API, any third-party library, any state pattern — they just work.
    link: /topics/coming-from-react
    linkText: Coming from React
---

## A subtraction, not a contrast

A long list of React-shaped concepts simply aren't here. Not removed. Not
"replaced by something else." Never introduced.

- **Virtual DOM** — JSX evaluates directly to DOM
- **Reconciliation** — nothing to diff
- **Render cycle** — components run once; events deliver deltas
- **Hooks** — closures hold state; classes hold state-with-methods
- **Synthetic events** — `onclick={fn}` is the native DOM property
- **State-vs-DOM split** — the DOM is the source of truth

Don't search for what replaces them. Often there isn't an equivalent, and
that's the point. See [coming from React](./topics/coming-from-react.md) for
the full translation.

## Quick start

```bash
npm install azoth
```

`vite.config.js`:

```js
import { defineConfig } from 'vite';
import azoth from '@azothjs/vite-plugin';

export default defineConfig({
    plugins: [azoth()]
});
```

`src/main.jsx`:

```jsx
const Greeting = ({ name }) => <p>Hello, {name}!</p>;

document.body.append(<Greeting name="world" />);
```

That's the whole shape. See [build and
integration](./topics/build-and-integration.md) for the full setup, or
jump into [workflow](./topics/workflow.md) for the
practice-tested methodology.

## A larger example

```jsx
import { channel } from '@azothjs/chronos/channels';

const SearchResults = ({ results }) => (
    <ul>{results.map(r => <li>{r.title}</li>)}</ul>
);

const Page = () => (
    <main>
        <h1>Results</h1>
        {channel(fetchResults(), SearchResults, {
            start: <p>Loading…</p>
        })}
    </main>
);

document.body.append(<Page />);
```

`channel()` connects an async source (a Promise, here) to a DOM slot, with a
synchronous loading state for immediate render. When the promise resolves,
the result replaces the loading content. No state, no effects, no
reconciler — the layout is what changes.

See [composition](./topics/composition.md) for the full `{…}` resolution
chain, and [async and channels](./topics/async-and-channels.md) for the
full Channel API.

## Reading order

Most readers benefit from this order:

1. [JSX as DOM](./topics/jsx-as-dom.md) — the foundational reframe
2. [Composition](./topics/composition.md) — the `{…}` slot mechanic
3. [Components](./topics/components.md) — function and class forms
4. [Async and Channels](./topics/async-and-channels.md) — async data as
   layout deltas
5. [Workflow](./topics/workflow.md) — UI-first methodology
6. [Coming from React](./topics/coming-from-react.md) — translation bridge
7. Everything else as needed

For the longer origin document — an LLM working through Azoth for the first
time and corrected over many sessions — see
[`MENTAL-MODEL.md`](./MENTAL-MODEL.md). The topic files are the curated
surface; the mental-model is the reasoning trace they were extracted from.

For LLMs working on Azoth code, start with [for LLMs](./topics/for-llms.md)
— terminology discipline, stop-and-ask triggers, and how to verify behavior
empirically with the sandbox.

## Status

Active development. Multiple production deployments. Open-source release in
progress — this documentation reorganization is part of that work. See
[`TODO.md`](https://github.com/azothjs/azoth/blob/main/TODO.md) for the
in-flight list.
