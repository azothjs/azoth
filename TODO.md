# Azoth TODO

## Maya

### Move channels from chronos to maya
The `channels/` folder in `packages/chronos/` should move to `packages/maya/`.
Channels are a rendering concern (subscribing to async data), not a data utility.

### Create Channel component
Add a built-in `<Channel>` component that wraps the `channel()` function with props:
- `async` - Promise or async iterable for data
- `as` - Component to render with data
- `loading` - Loading state element (optional, defaults to nothing)

Example usage:
```jsx
<Channel 
    async={fetchData()} 
    as={MyView}
    loading={<Loading />}
/>
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
