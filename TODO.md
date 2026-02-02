# Azoth TODO

## Maya

### Move channels from chronos to maya
The `channels/` folder in `packages/chronos/` should move to `packages/maya/`.
Channels are a rendering concern (subscribing to async data), not a data utility.

### Create Channel component
Add a built-in `<Channel>` component that wraps the `channel()` function with props:
- `async` - Promise or async iterable for data
- `as` - Render function that receives data directly: `as={data => <View {...data} />}`
- `loading` - Loading state element (optional, defaults to nothing)

The `as` function receives data directly, giving consumers control over prop mapping:
```jsx
// Array data — pass as prop
<Channel async={results$} as={r => <SearchResults results={r} />} />

// Object data — spread as props
<Channel async={fetchUserContext()} as={data => <LandingPageView {...data} />} />
```

Currently prototyped in `wre-dashboards/src/components/shared/Channel.jsx`.

## Chronos

### Rename generator to stream
The `generator()` function should be renamed to `stream()`:
- `stream` works as both verb and noun
- `generator` describes implementation, not purpose
- Return value names: `[asyncIterator, push]` instead of `[asyncIterator, dispatch]`

```js
// Before
const [results$, dispatch] = generator(transform);

// After
const [results$, push] = stream(transform);
```

## Compose

### Accept null from components
Components returning `null` or `undefined` should render nothing instead of throwing.
Currently components must return a DOM element.
