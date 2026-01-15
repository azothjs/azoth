Maya - Azoth Runtime
===

## Async to Layout

function | purpose
---|---
`use`    | Single transformation channel for asynchronous layout
`render` | Create and rerender the same component 
`act`    | Perform an action, optionally initializing a component to use

`defer`  | 
`tee`    | Split asynchronous data source to multiple feeds
`branch` | Combines `tee` with a `use` transformation per tee

## Use

```jsx
const Document = use(
    document$, 
    DocumentDetail,
    <Loading/>
);

return <div>
    <Document/>
</div>;
```

```jsx
return <div>
    <Use async={document$} as={DocumentDetail}>
        <Loading/>
    </Use>
</div>
```

## Update

```jsx
const Document = update(document$, DocumentDetail);

return <div>
    <Document/>
</div>;
```

```jsx
return <div>
    <Update async={document$} as={DocumentDetail}/>
</div>
```

## Act

```jsx
act(theme$, theme => html.className = theme);
```

```jsx
return <div>
    <Act async={theme$} as={theme => html.className = theme}/>
</div>
```

## Tee

```jsx
const shareable = tee(theme$);
const Document = use(shareable.instance(), DocumentDetail);
act(shareable.instance(), theme => html.className = theme);
```

```jsx
const shareable = tee(theme$);
return <div>
    <Act async={theme$} as={theme => html.className = theme}/>
</div>
```

## Tee 2

```jsx
const Document = use(tee(theme$), DocumentDetail)
act(tee($theme), theme => html.className = theme)


const Document = use(shareable.instance(), DocumentDetail);

act(shareable.instance(), theme => html.className = theme);

```


```jsx
return <div>
    <Use async={tee(theme$)} as={DocumentDetail}>
        <Loading/>
    </Use>

    <Act async={tee(theme$)} as={theme => html.className = theme}/>
</div>
```


## Stream

function | purpose
---|---
`stream`   | asynchronous data source with a dispatch function and optional transform function
`state` | Stream for emitting a value
`reduce` | Streamed value with old and new state value
`raf` | Request animation frame scheduler
`sync` | Sync scheduler - same as raf?
`tee` | Split asynchronous data source to multiple feeds


