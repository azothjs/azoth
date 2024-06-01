# Thinking in Hypermedia

Hypermedia is content media that is both the source of truth and provides interactivity to enhance and modify the media itself. This is very different than the state-based rendering architectures used by almost all modern javascript frameworks.

Hypermedia offers the advantages of:

1. Simplicity in design and execution
1. Always-optimal rendering based on context
1. Direct control of the media
1. Explicit user and usability focus

## What is State-based Rendering?

Current frameworks today require use of an APIs that maintains in-memory data as the source of truth from which the framework produces a projected UI. It can be represented as:

<pre>
    <code>ui = fn(state)</code>
</pre>

State-based rendering tends to focus developers inward on figuring out "what data is needed". Notice that suitability and usability do not need to be explicit addressed.

## How is Hypermedia Different?

Hypermedia consist of successive changes, each of which occurs independently:

<pre>
    <code>ui<sub>n</sub> = ui<sub>n-1</sub> + Δ<sub>i</sub></code>
</pre>

> _The UI is the prior state of the UI plus the delta of the last interaction_

In practice, rather than being arbitrary, the deltas are constrained to a set of well-known changes, which could be combinitorial:

<pre>ui<sub>n</sub> = ui<sub>n-1</sub> + Σ{Δ<sub>1</sub>, Δ<sub>2</sub>, ..., Δ<sub>m</sub>}</pre>

The summation represents the cumulative effect of one or more deltas applied during the nth interaction.

As architectual models, hypermedia and state-based rendering are mutually exclusive. State and the ui cannot _both_ be the source truth. In practice, the recent trend in split server/client rendering is a kludge of the two: <code>ui = ssr + islands</code> 

## Hypermedia > Azoth

Not HDA
Azoth as JS client example

## No State, No General Framework Reactivity

Hypermedia alleviates the need for both state and a controlling renderer for reactivity.

State-based rendering is a generic system in which _all_ changes must be reported as data state and ui updates are handled by the framework. 

With hypermedia, defined changes are _well-known_. Instead of using generic reactivity administred by a framework, each triggering events starts a change used to directly produce the required set of changes using the most appropriate means and the core framework only needs to support passively integrating the layout changes.

Create or modifying ui layout can be data-driven, but does not require state. In-memory state can still be used as data, but it has no special meaning compared to data retrieved from a database.

## A Simple Example

Consider the following simplified React app:

```jsx
export default function App() {
  const [emojis, setEmojis] = useState([]);

  useEffect(() => {
    (async () => {
      const emojis = await fetchEmojis();
      setEmojis(emojis);
    })();
  }, []);

  return (
    <>
      <h1>Emojis for Everyone</h1>
      <ul className="emojis">
        {emojis.map(emoji => <Emoji {...emoji}/>)}
      </ul>
    </>
  );
}
```

Here is the same result using Azoth:

```jsx
export default function App() {
  const EmojiChannel = use(
    fetchEmojis(),
    emojis => emojis.map(emoji => <Emoji {...emoji}/>),
  );

  return (
    <>
      <h1>Emojis for Everyone</h1>
      <ul class="emojis">
        <EmojiChannel/>
      </ul>
    </>
  );
}
```


