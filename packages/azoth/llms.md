# Azoth — guide for AI assistants

You are helping someone write application code that uses **azoth** (npm:
`azoth`, v2.x). This file is self-sufficient: everything you need to write
correct azoth code is below, most important first. It ships inside the
package, so in a repo it's at `node_modules/azoth/llms.md`.

## The one fact

**JSX evaluates to real DOM.** `<p>hello</p>` returns an actual
`HTMLParagraphElement` — not a description of one. There is no virtual DOM,
no reconciler, no render cycle, no mount point. You append JSX wherever DOM
goes:

```jsx
document.body.append(<main><h1>hello</h1></main>);
```

Every DOM API works directly on JSX output: `querySelector`, `classList`,
`addEventListener`, `append`. Hold nodes in variables. Mutate them. It's
your DOM.

## The core model — two moments

1. **Initial render** is a function call. Components run **once**, build
   DOM, and return it. They never re-run on their own.
2. **An update** is whatever channel you wired: an async value landing in a
   slot, a `rerenderer` you call again, or code mutating the DOM directly.

There is no third moment. Nothing watches, schedules, or reconciles. The
DOM itself is the source of truth; application state lives where JavaScript
already puts it — closures, class instances, the DOM.

```jsx
const Counter = () => {
    // `n` is state. The component runs once; the closure holds.
    let n = 0;
    const label = <span>{n}</span>;
    return <button onclick={() => { label.textContent = ++n; }}>{label}</button>;
};
```

No hooks exist. No dependency arrays. No stale closures — there is only one
closure, created once.

## Vocabulary

- **slot** — a `{…}` position in JSX; accepts any value (rules below).
- **anchor** — the comment node (`<!--az:N-->`) marking a slot in rendered
  HTML; `N` counts the nodes the slot currently owns.
- **compose** — the runtime that turns a slot value into DOM.
- **`Channel`** — component that maps an async source's values to DOM at a
  slot: `<Channel source as map error append eventType>`.
- **Input shape** — `{ initial, from, append? }` object literal in a slot:
  seed now, then drive from a source. Channel implements this shape.
- **`pushable()`** — returns `[asyncIterator, push]`; bridges
  events/callbacks into async iteration.
- **`rerenderer(fn)`** — wraps a render function; calling the result again
  re-runs `fn` and rebinds the SAME DOM with new values.
- **KeyedList** — custom elements (`KeyedUList`/`KeyedOList`/`KeyedTable`)
  for keyed rows driven by delta ops (`add`/`update`/`move`/`remove`).

Imports: `import { Channel, pushable, rerenderer, KeyedUList } from 'azoth';`

## Slots accept values

```jsx
<p>{'felix'}</p>          // string → text
<p>lives: {9}</p>         // number → text; {0} renders "0"
<p>{undefined}</p>        // undefined, null, true, false, '' → render NOTHING
<p>{cond && <em>yes</em>}</p>   // the conditional idiom
<p>{someNode}</p>         // a DOM node is inserted as-is
<ul>{items.map(i => <li>{i}</li>)}</ul>   // arrays: each member composes
<footer>{fn}</footer>     // a function is CALLED WITH NO ARGS; result composes
```

Rules that differ from what you may assume:

- Arrays are already valid children. **Never** `{...items}` spread-children
  — pass the array: `{items}`.
- A function in a slot receives **no arguments**. If you want props, that's
  a component: `<Fn/>`, not `{Fn}`.

## Async goes straight into slots

Promises, async generators, streams — no wrapper needed:

```jsx
<p>now — {fetch('/msg').then(r => r.text())}</p>

async function* clock() {
    while(true) { yield <time>{new Date().toLocaleTimeString()}</time>; await pause(1000); }
}
<div>{clock()}</div>
```

**Every async source replaces its previous value** — promise, async
iterable, `ReadableStream`, Observable (`.subscribe`). One rule.
Accumulation is opt-in via `append` (below). One live source per slot: a
new value or source supersedes the prior; superseded sources are torn down.

Errors from a bare source in a slot are unhandled by design — for handled
errors, use `<Channel error={…}>`.

## Channel — async source → DOM, with options

```jsx
// transform each value with `as`
<Channel source={getTicker(symbol)} as={({ price }) => usd.format(price)} />

// initial children show until the first value; `append` accumulates;
// EventTarget sources (a WebSocket IS one) take `eventType`
<ul>
    <Channel source={new WebSocket(url)}
        eventType="message"
        append
        as={({ data }) => {
            const { header, body } = JSON.parse(data);
            return <li><h2>{header}</h2><p>{body}</p></li>;
        }}>

        <p>Connecting…</p>

    </Channel>
</ul>
```

- `map` — when a value is an array, apply `as` per element:
  `<Channel source={fetchUsers()} as={User} map/>` renders one node per user.
- The initial children do NOT go through `as`.
- Under a rerender, same `source` reference → no-op (subscription keeps
  running); new reference → old subscription aborted, new one starts.
- Don't hold a Channel instance across rerenders — the JSX site owns it.

## The Input shape — seed, then drive

```jsx
function Counter() {
    let count = 0;
    const [count$, push] = pushable();
    const increment = () => push(++count);

    // seed the slot now, then drive it from the source
    return <button onclick={increment}>{{ initial: count, from: count$ }}</button>;
}
```

Any object with `from` (a Promise or async iterable) works in a slot:
`{ initial?, from, append? }`. `pushable()` bridges any callback API:
`onValue(push)`, `target.addEventListener(type, push)`, etc.

## Rerendering — same DOM, new values

```jsx
const panel = rerenderer(label => <section><h2>{label}</h2></section>);

// first call builds the <section>
const node = panel('Pets');

// same <section> comes back — <h2> rebound to "Animals"
panel('Animals');
```

The cache is keyed by **call site**, not call order — so ternaries, loops,
and early returns inside the wrapped function just work. Branches not taken
sleep (their DOM is kept and returns when the branch does); lists shrink and
regrow by position. Wire it to events via a Channel:

```jsx
<Channel source={detail$}
    as={rerenderer(detail => <DetailView {...detail}/>)}>
    Select an item
</Channel>
```

Every event re-runs `DetailView` — but the DOM is created once and rebound
thereafter. Wrap the **narrowest** expression; components run once and may
*return* a rerenderable — never `rerenderer(Component)`.

## Components

- Signature: `(props, childNodes) => DOM`. Props arrive as an object —
  `<C/>` passes `{}`, so destructuring with defaults is safe.
- **childNodes is the second argument**, not a prop. It is ONE composed DOM
  node (an element for a single child, a DocumentFragment for several),
  or `undefined`. It is opaque — compose by nesting, never introspect/map it.
- Classes are components: JSX instantiates, then drives `render()`:

```jsx
class Chat {
    constructor({ id }) {
        this.thread = <div class="thread"/>;
        this.input = <input onkeydown={e => { if(e.key === 'Enter') this.ask(); }}/>;
        this.el = <div>{this.thread}{this.input}</div>;
    }
    render() { return this.el; }
    async ask() {
        const q = this.input.value;
        this.input.value = '';
        this.thread.append(<p class="user">{q}</p>);
        this.thread.append(<p class="ai">{await answer(q)}</p>);
    }
}
// <Chat id={id}/> — encapsulated state + methods that mutate its own DOM
```

- Object components: `{ initialize?(props, childNodes), render(), update? }`.
- Returning `null` renders nothing; `<C/>` where `C` is null renders nothing
  (conditional components).
- Under a rerenderer, a component with `update(props)` is updated **in
  place** (constructor does not re-run); plain function components re-run.
- Primitives and DOM nodes are **not** components — a pre-built node is a
  value: `{node}`, never `<Node/>`. (The thrown errors say exactly this.)

## Attributes vs properties

- **Static** `attr="value"` compiles into the HTML template — any HTML
  attribute spelling works: `class="card"`, `for="name"`.
- **Dynamic** `attr={value}` assigns a DOM **property** at runtime — use the
  property name:

```jsx
<div className={cls}/>       // NOT class={cls}
<label htmlFor={id}/>        // NOT for={id}
<input readOnly={flag}/>     // NOT readonly={flag}
<div data-id={id}/>          // data-* uses setAttribute — hyphenated is fine
```

Using the attribute spelling dynamically is a **compile error** with a
pointed message, not a silent no-op.

## Keyed lists — structure that manages itself

When rows appear/reorder/vanish over time, don't re-render a list — use a
keyed list and drive it with deltas:

```jsx
import { KeyedUList } from 'azoth';

class PetList extends KeyedUList {
    constructor() {
        super();
        this.key  = p => p.id;               // identity
        this.view = p => <li>{p.name}</li>;  // per-row rerenderable
    }
}
customElements.define('pet-list', PetList);

const list = document.createElement('pet-list');
document.body.append(list);
list.addAll(pets);
list.update(1, { id: 1, name: 'Felicia' });  // same <li>, rebound in place
list.remove(2);
```

Ops: `add(...items)`, `addAll(items)`, `insert(data, beforeKey)`,
`update(key, data)`, `move(key, beforeKey)`, `remove(key)`, `clear()`,
`get(key)`, `has(key)`, `keyFor(node)` (event target → row key), `size`.
No index positions; no diffing — you name the change.

## Reading rendered HTML

Azoth's runtime bookkeeping is visible in `innerHTML`:

- `<!--az:N-->` — a slot's anchor; `N` = how many nodes the slot currently
  owns (`az:0` empty, `az:3` after an array of three). Content sits BEFORE
  its anchor. Authored comments in content are inert — only `az:` counts.
- `data-bind=""` — marks elements carrying compiled bindings.

`<main><p>felix</p><!--az:1--></main>` = one slot in `<main>`, currently
holding one node.

Whitespace in JSX is preserved as text nodes — multi-line JSX children
produce whitespace nodes between siblings. Keep JSX single-line when exact
HTML output matters (tests, snapshots). Attribute-position line breaks are
always safe.

## DO / DON'T

```jsx
// DO: local variables for state          // DON'T: look for useState
let open = false;

// DO: call methods on held nodes         // DON'T: re-render to change text
label.textContent = value;

// DO: pass arrays                        // DON'T: spread children
<ul>{items}</ul>                          // <ul>{...items}</ul> is a compile error

// DO: className for dynamic              // DON'T: class={...}
<div className={cls}/>

// DO: childNodes as second arg           // DON'T: props.children
const Card = (props, childNodes) => <div class="card">{childNodes}</div>;

// DO: interpolate a held node            // DON'T: use a node as a component
<main>{node}</main>                       // <Node/> throws

// DO: wire an async source once          // DON'T: poll or re-run components
<Channel source={stream} as={View}/>
```

## Catch and correct

If you notice these words in your plan, translate before writing code:

| Reaching for | In azoth |
|---|---|
| `useState` / `useRef` / hooks | a local variable or instance field; the closure holds |
| `useEffect` / lifecycle | just code — run it where it reads naturally; events for later |
| "re-render the component" | mutate the DOM, or call a `rerenderer` you wired |
| `key` prop | KeyedList with an author-defined `key(data)` |
| `props.children` / `React.Children` | `childNodes` — second argument, opaque DOM |
| synthetic events / `e.persist()` | native DOM events, native handlers (`onclick={fn}`) |
| suspense / `use()` | put the Promise in the slot |
| `createRoot(...).render(...)` | `document.body.append(<App/>)` |

## When something throws

Azoth's errors teach. Follow their instruction:

- `Cannot use a DOM Node as a component… Interpolate it instead: {node}` —
  you wrote `<X/>` where `X` holds a node.
- `Cannot use string (…) as a component… interpolate it directly: {value}` —
  a primitive in component position.
- `Did you mean to include a "render" method?` — an object without `render`
  used as a component.
- A `class={…}`-style compile error names the property to use instead.

## Going deeper (network access required)

The canonical deep reference is the repo's conformance suite — real
authored code with frozen, verified output:
<https://github.com/azothjs/azoth/tree/main/packages/valhalla> (start at its
`index.md`). Concept docs: `docs/topics/` (frames, hypermedia); rule map:
`docs/design/core-rules.md`; the intro article: `docs/articles/`.

## Suggested agent-config snippet

If this project uses azoth, add to the repo's `AGENTS.md` / `CLAUDE.md`:

> This project uses **azoth** — JSX that returns real DOM (no vDOM, no
> re-renders, no hooks). Before writing azoth code, read
> `node_modules/azoth/llms.md`.
