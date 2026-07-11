Azoth - "JSX for the Web Platform"

(note: need better intro)
Welcome to the Design Age, where greater expressiveness and control of UI/X is an advantage. 


Through subtraction, not replacement, Azoth removes a decade of framework cruft and plugs JSX into the gap in the web platform:

- without vDom or any intermediate representation
- without a controlling framework or render tree
- without js-created DOM
- without state management

Do I have your attention yet?

Instead JSX:

- returns DOM
- maintains 100% control flow fidelity
- accepts any asynchronous javascript
- is rerenderable
- faithfully works with every Web Platform API

Those are some big claims, let's look at how it works.

# Compiling JSX

(note: need to regenerate sample with latest azoth. consider adding a static and dyanmic prop, and put a span around name. A subcomponent not a bad idea too (shows up in the binding function). For the talk, this was kept minimal, to fit on a slide and not overwhelm with too much, but as a read artifact can it support more. (or should it stick to simple example?))

Here's a snippet of JSX:

```jsx
const Greeting = ({ name }) => {
    const salutation = name === 'Azoth'
        ? "Whazzup" : "Hello";
    return <p>{salutation}, {name.toUpperCase()}!</p>;
};
document.body.append(<Greeting name="Azoth" />);
```

Notice the JSX being directly appended to `document.body`, Azoth JSX **returns DOM**. (note: here about no controlling renderer, but want to refine the claim). At compile time the jsx in the runtime code is replaced in-situ, and additional artificats are create.

## The transpiled code

First, let's look at how originally authored code changes:

```js
import { createComponent } from 'azoth/runtime';
import { t4a104a2a } from 'virtual:azoth-templates?id=4a104a2a';

const Greeting = ({ name }) => {
    const salutation = name === 'Azoth'
        ? "Whazzup" : "Hello";
    return t4a104a2a(salutation, name.toUpperCase());
};
document.body.append(createComponent(Greeting,
    { name: "Azoth" }));
```

Two things to notice:
1. The imported modules:
    - The replacement template for the JSX (details below)
    - A runtime function to manage component creation
2. The rest of the javascript structure is faithfully preserved, including the properties and interpolations. Only the JSX has been replaced, **runtime control flow fidelity is fully preserved**

Direct replacement by call-site. **No vDOM, no factory functions, no JavaScript bloat.**

Let's look where the rest of the information represented by the JSX landed. 

## Html goes in `.html`

The html itself is delivered in `<page>.html`, DOM creation is handled _by the browser's html parsing engine_:

```html
<template id="4a104a2a">
  <p><!--az:0-->, <!--az:0-->!</p>
</template>
```

The win here isn't browser vs JavaScript instantiation time, it's **no JavaScript in the code bundle that needs to be parsed to get to DOM creation**.

## Decomposition

Three JavaScript parts get created by the compiler. First is the refinement from element to comment nodes on interpolators:

```js
const g356056d3 = r => [r.childNodes[0], r.childNodes[2]];
```

Second, the actual binding function. Includes properties, composition into the surrounding DOM, and child component management:

```js
// Binder
// TODO: show compose import
const bac4750db = ([a, b]) => (x, y) => {
    compose(a, x); 
    compose(b, y);
    // props to be added, maybe component
};
```

These first two are deduped and shared among templates with same sub-structure.

The template factory, exported and consumed in the original call site.

```js
export const t4a104a2a = renderer("4a104a2a", g356056d3, bac4750db);
```

(note: when we regenerate examples, consider if worth calling out per-site rerender)

# Layout Management

Compiling shows the mechanics, removing state management is bigger leap, it requires changing how you think about building web applications. Two key questions need to be addressed.

First, why even let go of state management _as an integrated part of frontend frameworks_? The answer is it:
- Sets a high level of complexity across the board for any type of change 
- Restricts what you can do with the platform
- Favors an internal focus that solves engineering problems at the expense of users

Second, if not using state management, then what is the alternative? It's layout management. Controlled changes that update the document as the source of truth. This is hypermedia, it's how the web platform was designed and built. Additions, removals, swaps – each a change to the ledger through a defined channel.

If state management is `ui = fn(state)`, then hypermedia is <code>ui<sub>n</sub> = ui<sub>n-1</sub> + Δ<sub>i</sub></code>. What that means is that Azoth models the UI as a sequence of deltas applied to the prior UI:

```
ui₀  = initial render
ui₁  = ui₀ + Δ
ui₂  = ui₁ + Δ
...
uiₙ  = uiₙ₋₁ + Δ
```

Each Δ is delivered by an event. The DOM is the source of truth; events modify it in place. There is no separate state being projected — the UI already exists, and the next event tells it how to change.

These two models are mutually exclusive. State and UI cannot *both* be the
source of truth.

# Opt-in to complexity

In practice, what this means is that the complexity of the type of delta being applied can scale based on the change needed. 

## Asynchronusly delayed rendering

The default rendering mode in Azoth is forward-only. Yet his also includes using asynchronicity (as the event) to deliver content later:


```jsx
<p>Render me now - {Promise.resolve(`Render me later`)}</p>
```

The JSX slot itself accepts a `Promise`! Any valid JavaScript can feed into that:

```jsx
function CatList() {
    async function getCats() {
        const cats = await fetchCats();
        return cats.map(cat => <Cats {...cat}/>)
    }

    return <ul>{getCats()}</ul>;
}
```

It took React six years to deliver on suspense/use in order to _opt-out_ of it's default model. Azoth allows you to _opt-in_ uisng a `Promise`. And it fully works in the client with plain JavaScript.

It's not just promises delivering a single value, it's any value(s) over time: 
- `EventTarget` 
- [`Observable`](https://github.com/WICG/observable) (WICG spec, use [RxJs](https://rxjs.dev/) until available) 
- [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) 
- [`AsyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator)
- Anything bridged with a listener function (Supabase, Firebase/Firestore, Appwrite, PocketBase, SurrealDB)

## Channel

A delta delivered by an event with a payload which is then mapped to DOM is called a `channel` in Azoth. A utility component `<Channel/>` facilitates this pattern:

```jsx
function Ticker(symbol) {
    return <div>
        {symbol}:
        <Channel 
            source={getTickerStream(symbol)} 
            as={({ price }) => usdFormatter.format(price)}
        />
    </div>;
}
```

It also offers additional options, like a default display and whether to append to existing content, instead of replacing it:

```jsx
function Feed({ url }) {
    return <ul>
        <Channel source={new WebSocket(url)} 
            eventType="message"
            append
            as={({ data: { header, content } }) => <li>
                <h2>{header}</h2>
                <p>{content}</p>
            </li>}>

            <p>Connecting to feed...</p>
        
        </Channel>
    </ul>;
}
```

## Local state

Simple event loops can be creating using async iterators or DOM events directly:

```jsx
const Counter = () => {
    let n = 0;
    const label = <span>{n}</span>;
    return <button onclick={() => { label.textContent = ++n; }}>
        {label}
    </button>;
};
```

Azoth has a small `pushable` utility function, which wraps an async iterator, that can be used to adapt an asychronous data source, or set up an event loop:

```jsx
function Counter() {
    let count = 0;
    const [count$, push] = pushable;
    const increment = () => push(++count);
    return <button onclick={increment}>{count$}</button>;
}
```

## Rerendering

Delayed rendering and swapping content are useful technique. But oftentimes a a section of the document needs to be rerendered: new data over the same bound dom parts. This is achieved by passing a thunk to the `rerenderer` Azoth function.

```jsx
function App() {
    const [detail$, push] = pushable;
    const handleSelect = (id) => push(fetchDetail(id));
    
    return <main>
        <Channel source={fetchItems()} as={items => (
            <ListView items={items} onselect={handleSelect}/>
        )}>
            Loading list...
        </Channel>

        <Channel source={detail$}> as={rerenderer(({ result }) => <DetailView {...result}/>)}>
            Select an item from the list
        </Channel>
    </main>
}

function ListView({ items, onselect }) {
    return <ul>{items.map(({ id, title }) => (
        <li onclick={() => onselect(id)}>{title}</li>
    ))}</ul>
}

function DetailView({ title, type, description, tags }) {
    const badge = type === 'premium' ? <span>VIP</span> : <button>Upgrade</button>;
    return <article>
        <h1>{title}</h1>
        <p>{badge}-{description}</p>
        <Tags tags={tags}/> 
    </article>
}

function Tags({ tags }) {
    return <ul>{tags.map(tag => <li>{tag}</li>)}</ul>;
}


```

The `rerenderer(({ result }) => <DetailView {...result}/>))` causes the `DetailView` and all it's descendants to run each time, but only creates new DOM on the first pass, otherwise it replays the bindings over the previously created DOM.

It handled not only the list of tags, but also the conditional rendering logic! That's because rerendering is keyed on call site, not call order. That's control flow preserved, full web platform fidelity.




---

(note: below is draft verbiage or copied snippets from docs)


This is the sense in which **Azoth makes the platform act like a framework**:
the self-managing component, the lifecycle, the encapsulated render cycle — the
platform already ships all of it, as custom elements. Azoth doesn't reinvent the
component; it hands off to the one the browser already gives you.