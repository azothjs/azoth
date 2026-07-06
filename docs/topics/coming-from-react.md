# Coming from React

> If you've spent years in React, the friction you feel reading Azoth code is
> real, and it's worth naming.
>
> I came in looking for the things React had taught me to look for: the render
> cycle, the reconciler, the state primitives, the lifecycle. None of them are
> here. At first that felt like things were missing. After a while it stopped
> feeling like absence and started feeling like permission — the JavaScript
> and DOM I'd been working *around* for a decade were finally allowed to do
> their jobs.
>
> This page is the bridge. It's not a tutorial; it's a translation table for
> the moments when your React intuition reaches for something and Azoth's
> answer is "you don't need that here."

## The single shape difference

|                  | React                            | Azoth                          |
| ---------------- | -------------------------------- | ------------------------------ |
| Source of truth  | State                            | DOM (hypermedia)               |
| Data flow        | State → render → DOM             | Data → channel → DOM           |
| Updates          | Re-render component tree         | Direct DOM mutation            |
| Async handling   | `useEffect` + `useState`         | Async data in `{…}` slots      |

That table is the whole reframe. Every specific question downstream is a
consequence of that one shift.

## Subtraction, not contrast

The hardest thing to internalize: a long list of React features simply
**aren't there**. Not removed. Not "replaced by something else." Never
introduced.

- **Virtual DOM** — JSX evaluates directly to DOM. See [jsx-as-dom](jsx-as-dom.md).
- **Reconciliation** — there's nothing to diff. The DOM you created is the DOM
  you have until you mutate it.
- **Render cycle** — components run once. Events deliver deltas. See
  [hypermedia](hypermedia.md).
- **Hooks** — `useState`, `useRef`, `useEffect`, `useMemo`, `useCallback`,
  `useContext`: none exist. The things they solved are solved differently or
  weren't problems in the first place.
- **Synthetic events** — `onclick={fn}` is the native DOM property assignment.
  `e` is the real `Event`. No `e.persist()`, no `SyntheticEvent`.
- **`React.Children` manipulation** — children are opaque DOM. Compose, don't
  introspect. See [components](components.md).
- **`key` prop on lists** — list management uses [blocks](maya-runtime.md), not
  a render-cycle keying scheme.

Don't search for the Azoth equivalent of a React feature. Often there isn't
one, and that's the point.

## When you reach for X, think Y

### "Where does this state live?"

It probably doesn't need to. Ask instead: **what layout change happens when
this data arrives?** A local variable in a closure holds per-instance values.
A channel pipes async data into a DOM slot. The DOM holds what's currently
displayed. See [hypermedia](hypermedia.md) on layout management.

### "I need `useEffect` to fetch this data"

Put the promise directly in the JSX slot:

```jsx
<div>{fetchUser(id).then(user => <UserCard user={user}/>)}</div>
```

Or wrap with `channel()` for loading states. See
[async-and-channels](async-and-channels.md).

### "I need `useRef` to hold a mutable value"

Just declare a variable. The component function runs once, so a `let` binding
persists for the life of the component instance:

```jsx
const Counter = () => {
    let count = 0;
    return <button onclick={e => {
        count++;
        e.currentTarget.textContent = `Count: ${count}`;
    }}>Count: 0</button>;
};
```

### "I need `useState` to trigger a re-render"

There's no re-render to trigger. To update the DOM, mutate it (the boring
direct way), or wire a channel for declarative updates. For sections with
predictable updates, the [renderer pattern](maya-runtime.md) gives you a
deliberate replay mechanism — which is what `useState` was trying to be.

### "I need a `ref` to access the DOM element"

The JSX expression *is* the DOM element. Hold a reference to it:

```jsx
const input = <input type="text" /> as HTMLInputElement;
input.focus();
```

### "I need to map over children"

You can't introspect Azoth's `childNodes`. The pattern is composition — pass
specific components instead of generic children:

```jsx
// Don't try: React.Children.map(children, …)
// Do: pass exactly what you need

<Card header={<HeaderBar/>} body={<Content/>}/>
```

See [components](components.md) for the childNodes model.

### "I need a context provider"

Pass props. Or use a module-level variable for genuinely global state. Or use
any state library you like — Azoth doesn't own state, so any pattern works.
See [authoring-style](authoring-style.md) for data ownership conventions.

### "I need `className={isActive ? 'on' : 'off'}`"

That works directly. The foot-gun is the name: use `className` for dynamic,
`class` for static. See [attributes-and-properties](attributes-and-properties.md).

### "I need to memoize this expensive computation"

If the component runs once, the computation runs once. No memoization needed
at the component level. For repeated work driven by data updates, the channel
transform is where you'd cache.

### "Where do error boundaries go?"

Use try/catch in the async function that resolves the JSX:

```jsx
async function loadList() {
    try {
        const items = await fetchItems();
        return <List items={items}/>;
    } catch(err) {
        return <Oops error={err}/>;
    }
}

return <div>{loadList()}</div>;
```

JavaScript already had this. Use it.

## Habits to unlearn

- **"This re-runs whenever X changes"** — no it doesn't. The function ran
  once. Events are what change things.
- **"I should extract this to a hook"** — there are no hooks. Extract to a
  function if it makes sense, or to a class if you need encapsulated state.
- **"Be careful about stale closures"** — closures aren't stale in Azoth
  because the function only ran once. The closure is *always* over the
  initial values.
- **"This will cause a re-render"** — it won't. Mutating the DOM mutates the
  DOM.

## Where to go next

Once the React frame relaxes, the rest of the docs read normally. Start with:

- [JSX as DOM](jsx-as-dom.md) — the foundation
- [Components](components.md) — function and class forms
- [Composition](composition.md) — the `{…}` slot mechanic
- [Async and Channels](async-and-channels.md) — promises and updates
- [Hypermedia](hypermedia.md) — the events-as-deltas model
- [For LLMs](for-llms.md) — terminology discipline (also useful for humans
  retraining their reach)

## See also

- [`MENTAL-MODEL.md`](../history/MENTAL-MODEL.md) — the longer, looser document this
  site grew from. Contains additional React/Azoth contrast prose if you want
  more of it.
