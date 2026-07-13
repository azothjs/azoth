Azoth - "JSX for the Web Platform"

Welcome to the web platform as a framework. Most new frameworks introduce themselves by telling you what they're adding. Azoth is different. It removes most of what you know about frameworks, then uses JSX to amplify what the platform already ships.

In the new AI era, code is cheap and cookie-cutter apps are commodity. Elevated work focuses on experience and transformation. Azoth allows you to freely express your design, taste, and judgement by giving full access to, and control of, the web platform.

This is the first in a series of three introductory articles on Azoth:
1. The core mechanics of replacing modern frameworks with hypermedia
2. Enhanced composition: functional components, UIComponent, Input, and web components
3. Using AI with Azoth: leaning into the corpus

# Subtract to Unlock

Azoth's first move is to subtract, without replacement, a decade of framework cruft — plugging JSX into the gap in the web platform:

- without vDOM or any intermediate representation
- without a controlling framework or render tree
- without js-created DOM
- without state management (hold that thought)

Instead JSX:

- returns DOM
- preserves your control flow — ternaries, loops, closures, untouched
- accepts any asynchronous JavaScript
- is rerenderable
- works directly with the web platform — no synthetic layer to cross

Those are some big claims, let's look at how it works. And don't take my word for any of it — every example in this article runs in the repo's test suite ([`article-examples.test.tsx`](../../packages/valhalla/article-examples.test.tsx)).

# Compiling JSX

Here's a snippet of JSX:

```jsx
const Greeting = ({ name }) => {
    const salutation = name === 'Azoth'
        ? "Whazzup" : "Hello";
    return <p>{salutation}, {name.toUpperCase()}!</p>;
};
document.body.append(<Greeting name="Azoth" />);
```

Notice the JSX being directly appended to `document.body` — Azoth JSX **returns DOM**. There's no mount point, no `createRoot(...).render(...)`, and no runtime that owns the tree afterward: nothing schedules a re-visit, nothing reconciles. What updates is what you wire to update.

At compile time the JSX is replaced in-situ in the runtime code, and additional artifacts are created.

## The transpiled code

Here's how the originally authored code changes:

```js
import { __createComponent } from 'azoth/runtime';
import { t0c2ba934 } from 'virtual:azoth-templates?id=0c2ba934';

const Greeting = ({ name }) => {
    const salutation = name === 'Azoth'
        ? "Whazzup" : "Hello";
    return t0c2ba934(salutation, name.toUpperCase());
};

document.body.append(__createComponent(Greeting, { name: "Azoth" }));
```

Two things to notice:
1. The imported modules:
    - The replacement template for the JSX (details below)
    - A runtime function to manage component creation
2. The rest of the JavaScript structure is faithfully preserved, including the properties and interpolations. Only the JSX has been replaced — **runtime control flow is fully preserved**.

Direct replacement by call site. **No vDOM, no factory functions, no JavaScript bloat.**

Let's look where the rest of the information represented by the JSX landed.

## Html goes in `.html`

The html itself is delivered in `<page>.html`, DOM creation is handled _by the browser's html parsing engine_:

```html
<template id="0c2ba934">
    <p><!--az:0-->, <!--az:0-->!</p>
</template>
```

The win here isn't browser vs JavaScript instantiation time, it's **no JavaScript in the code bundle that needs to be parsed to get to DOM creation**.

Those `<!--az:0-->` comments are anchors — stable positions where the dynamic values will land. Which brings us to the remaining artifacts.

## Decomposition

Three JavaScript parts get created by the compiler. First, a target selector — from the cloned template root to the exact nodes that will change:

```js
export const g356056d3 = r => [r.childNodes[0], r.childNodes[2]];
```

Second, the binding function. It receives the targets once, and returns the per-render application of values:

```js
import { __compose } from 'azoth/runtime';

export const bac4750db = (ts) => {
    const t0 = ts[0], t1 = ts[1];
    return (v0, v1) => {
        __compose(t0, v0);
        __compose(t1, v1);
    };
};
```

These first two are keyed by structure, not by template — they're **deduped and shared** among all templates with the same shape.

Third, the template factory, exported and consumed at the original call site:

```js
export const t0c2ba934 = __render("0c2ba934", g356056d3, bac4750db, false);
```

Each call site gets its own factory — that per-site identity is what makes rerendering possible later (more below).

The example above only has child interpolations, so the binder is all `__compose`. Give it a dynamic property and a child component:

```jsx
const Badge = ({ status, label }) => <p className={status}><Icon type={status}/> {label}</p>;
```

and the binder grows to exactly what you'd write by hand:

```js
return (v0, v1, v2) => {
    t0.className = v0;
    __composeComponent(t1, v1);
    __compose(t2, v2);
};
```

Property assignment, component creation, composition — that's the entire vocabulary.

# Layout Management

Compiling shows the mechanics; removing state management is a bigger leap — it requires changing how you think about building web applications. Two key questions need to be addressed.

First, why even let go of state management _as an integrated part of frontend frameworks_? The answer is it:
- Sets a high level of complexity across the board for any type of change
- Restricts what you can do with the platform
- Favors an internal focus that solves engineering problems at the expense of users — a decade in, every dashboard greets you with the same skeleton-wipe re-render for a one-field change

Second, if not using state management, then what is the alternative? It's layout management. Controlled changes that update the document as the source of truth. This is hypermedia — it's how the web platform was designed and built. Additions, removals, swaps — each a change to the ledger through a defined channel.

If state management is `ui = fn(state)`, then hypermedia is <code>ui<sub>n</sub> = ui<sub>n-1</sub> + Δ<sub>n</sub></code>. What that means is that Azoth models the UI as a sequence of deltas applied to the prior UI:

```
ui₀  = initial render
ui₁  = ui₀ + Δ
ui₂  = ui₁ + Δ
...
uiₙ  = uiₙ₋₁ + Δ
```

Each Δ is delivered by an event. The DOM is the source of truth; events modify it in place. There is no separate state being projected — the UI already exists, and the next event tells it how to change.

These two models are mutually exclusive. State and UI cannot *both* be the source of truth.

To be precise: your application still has state. It lives as distributed data outside the browser and inside the browser where JavaScript already puts it — closures, class instances, the DOM itself. What's subtracted is the *required management layer* between that state and the document: the store, the reconciler, the projection. You'll see this concretely in "State without the management" below.

# Opt-in to complexity

In practice, this means the complexity of the type of delta being applied can scale based on the change needed. Each step is opt-in: you take on more of the update contract only where the UI calls for it — render now, render later, render again.

## Asynchronously delayed rendering

The default rendering mode in Azoth is forward-only. However, this also includes using asynchronicity (as the event) to deliver content later:

```jsx
<p>Render me now - {Promise.resolve(`Render me later`)}</p>
```

The JSX slot itself accepts a `Promise`! Any valid JavaScript can feed into that:

```jsx
function CatList() {
    async function getCats() {
        const cats = await fetchCats();
        return cats.map(cat => <Cat {...cat}/>);
    }

    return <ul>{getCats()}</ul>;
}
```

It took React six years to deliver suspense/`use` in order to _opt-out_ of its default model. Azoth lets you _opt-in_ using a `Promise`. And it fully works in the client with plain JavaScript.

It's not just promises delivering a single value, it's any value(s) over time:
- `EventTarget`
- [`Observable`](https://github.com/WICG/observable) (WICG — shipping in Chrome, Firefox implementing; RxJS-compatible today)
- [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- async iterables — [async generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*) and friends
- anything bridged with a listener function (Supabase, Firebase/Firestore, Appwrite, PocketBase, SurrealDB)

## Channel

In Azoth, a *channel* is an async source whose values are mapped to DOM at a slot — the delta, its event, and its rendering in one wiring. The utility component `<Channel/>` facilitates the pattern:

```jsx
function Ticker({ symbol }) {
    return <div>
        {symbol}:
        <Channel
            source={getTickerStream(symbol)}
            as={({ price }) => usdFormatter.format(price)}
        />
    </div>;
}
```

It also offers additional options, like a default display and whether to append to existing content instead of replacing it:

```jsx
function Feed({ url }) {
    return <ul>
        <Channel source={new WebSocket(url)}
            eventType="message"
            append
            as={({ data }) => {
                const { header, content } = JSON.parse(data);
                return <li>
                    <h2>{header}</h2>
                    <p>{content}</p>
                </li>;
            }}>

            <p>Connecting to feed...</p>

        </Channel>
    </ul>;
}
```

A `WebSocket` is just an `EventTarget` — `eventType` says which event to listen for, the initial children show until the first message arrives, and `append` accumulates instead of replaces.

## State without the management

Simple event loops can be created using DOM events directly:

```jsx
const Counter = () => {
    let n = 0;
    const label = <span>{n}</span>;
    return <button onclick={() => { label.textContent = ++n; }}>
        {label}
    </button>;
};
```

`n` is state. It lives in a closure, because the component runs once and the closure holds — no hook required. And notice the handler just mutates the DOM. That's not a cheat — it's the floor everything else in this section stands on: the DOM is yours, and the wiring above it is convenience, not permission.

Azoth also has a small `pushable` utility — it creates a push-driven async iterator, the bridge from callback-style sources (or your own events) to pull-based iteration:

```jsx
function Counter() {
    let count = 0;
    const [count$, push] = pushable();
    const increment = () => push(++count);

    // seed the slot now, then drive it from the source
    return <button onclick={increment}>{{ initial: count, from: count$ }}</button>;
}
```

The `{ initial, from }` object is Azoth's *Input* shape: seed the slot now, then drive it from the source. (`<Channel/>` is one implementer of the same shape.)

## Rerendering

Delayed rendering and swapping content are useful techniques. But oftentimes a section of the document needs to be rerendered: new data over the same bound DOM parts. This is achieved by passing a thunk to the `rerenderer` Azoth function. The whole idea in three lines:

```jsx
const panel = rerenderer(label => <section><h2>{label}</h2></section>);

// first call builds the <section>
const node = panel('Pets');

// same <section> comes back — <h2> rebound to "Animals"
panel('Animals');
```

Re-run at the same site, and the delta lands on the same DOM. Now wire it to events, in app shape — a master list driving a detail pane:

```jsx
function App() {
    const [detail$, push] = pushable();
    const handleSelect = async (id) => push(await fetchDetail(id));

    return <main>
        {/* fetch once, render the list */}
        <Channel source={fetchItems()} as={items => (
            <ListView items={items} onselect={handleSelect}/>
        )}>
            Loading list...
        </Channel>

        {/* every selection event rebinds the SAME DetailView DOM */}
        <Channel source={detail$}
            as={rerenderer(detail => <DetailView {...detail}/>)}>
            Select an item from the list
        </Channel>
    </main>;
}

function ListView({ items, onselect }) {
    return <ul>{items.map(({ id, title }) => (
        <li onclick={() => onselect(id)}>{title}</li>
    ))}</ul>;
}

function DetailView({ title, type, description, tags }) {
    const badge = type === 'premium' ? <span>VIP</span> : <button>Upgrade</button>;
    return <article>
        <h1>{title}</h1>
        <p>{badge}-{description}</p>
        <Tags tags={tags}/>
    </article>;
}

function Tags({ tags }) {
    return <ul>{tags.map(tag => <li>{tag}</li>)}</ul>;
}
```

The `as={rerenderer(detail => <DetailView {...detail}/>)}` runs `DetailView` and all its descendants on every event — but only creates DOM on the first pass. After that, it replays the bindings over the previously created DOM: same `<article>`, same nodes, new values.

Look at what that handled. The list of tags. And the conditional `badge` — select a premium item, then a basic one, then premium again: the `<span>VIP</span>` that comes back is the *same node* that rendered the first time. The branch not taken doesn't die; it sleeps, cached at its site.

Here's why that works, and why it can't in a hooks world: React re-executes components against a cache keyed by **call order** — which is why control flow around hooks is forbidden. Azoth re-executes against a cache keyed by **call site** — so ternaries, loops, and early returns just work. That's the control-flow fidelity promised at the top, paid off.

# The two moments

Step back and every option in this article reduces to the same pair: the **initial render** is a function call; an **update** is whatever channel you wired. The mechanisms differ only in what survives between the two — a swap keeps the position, a rerender keeps the DOM, an imperative op keeps everything but what you touched. There's no third moment where a framework reconciles on your behalf. vDOM reconciliation is the tell of the other model: deltas applied where the delta must be *computed*, because it was never known. In Azoth the delta arrives already known — it's the event.

And because bindings are fine-grained — an element property here, a comment anchor there — nothing owns the tree between those two moments. Restructure it, hand nodes to d3 or GSAP, combine trees from anywhere: there's no watcher to fight, because there was never a watcher.

That pair — build once, then change on a known channel — scales past slots and rerenders: regions that manage their own structure on their own clock (chat threads, live lists, keyed rows). That's article two: enhanced composition — components, the update protocol, Input, and web components.

# Next

This first part explained the mechanics of how Azoth subtracts most of modern frontend frameworks: internal representation, render tree ownership, and state management. Hypermedia and layout management are the new paradigm for change over time. JSX is semantically aligned to fit into the web platform without obstructing its use.

The next part will dive into the rich layers of composition this unlocks, from traditional functional components to fully integrated web components, and everything in between.

Azoth 2.0 is [on npm](https://www.npmjs.com/package/azoth) — `npm i azoth`, add the Vite plugin, and kick the tires. The [repo](https://github.com/azothjs/azoth) has the docs, and the test suite that runs every example you just read.
