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

## Compose

### Accept null from components
Components returning `null` or `undefined` should render nothing instead of throwing.
Currently components must return a DOM element.
