# Async Child Composition `{...}`

A variety of asynchronous data providers can be used with Azoth child composition:

type | mechanism | terminate via
---|---|---
`Promise` | `.then()` | abort*
`ReadableStream` | `WritableStream` | close
`AsyncIterator`* | `.next()` | return
subscription | `.subscribe()` or `.on()` | unsubscribe*

Notes:
- Unless an abort controller is provided, promises can't be cancelled by consumers 
- Generator functions are the primary means of creating async iterators
- Subscriptions are expected to return an unsubscribe function

## Thinking Asynchronously

In hypermedia apps, changes to the ui are made in discrete chunks. 

Design for templates that:
1. Consume data on initial render
1. Plan for future layout modifications

Let's look at a basic `Promise` for a list as an example.

### Traditional Templates

Consider the following template in a state-driven framework (for simplicity, there are no loading semantics):

```jsx
return <div>{items && <List items={items}/>}</div>;
```

There is an ambiguity in this template: Is it _waiting_ for items? Or is it mitigating a response that _didn't have items_? Or both? 

It is an intended feature of thinking in `ui = fn(state)` that you theoretically shouldn't need to care about it. But with effect dependencies, memo and memoize, SSR and hydration complexity, there is a rising cost of maintaining the abstraction.

How else could we think about this?

### Hypermedia Templates

Hypermedia is thinking in terms of:

<pre>
ui<sub>n</sub> = ui<sub>n-1</sub> + Δ
</pre>

- Complete render of the current phase with what is known
- Connect future data and events to future layout modifications

In practice in the example, start by lifting out what cannot be rendered _right now_:

```jsx
// TODO: we need <List items={items}/>, but not now!
return <div>{/*future*/}</div>;
```

 Next, implement the layout of the items in the future when the data is known. 
 
 Depending on your coding preference, you can create an effect-type function:

```jsx
async function loadList() {
    const items = await fetchItems();
    return <List items={items}/>;
});

return <div>{loadList()}</div>; 
``` 

Or chain the layout creation using promise resolution:

```jsx
<div>
    {fetchItems.then(items => <List items={items}/>)}
</div>
```

In both cases, the rendering occurs in the future "now" with known data. The focus is on _layout_ management instead of state management. 

Error responses happen in context and can use the same layout channel to provide updates:

```jsx
async function loadList() {
    try {
        const items = await fetchItems();
        return <List items={items}/>;
    }
    catch(err) {
        return <Oops error={err}/>
    }
});

return <div>{loadList()}</div>; 

// or

return <div>
    {fetchItems
        .then(items => <List items={items}/>)
        .catch(err => <Oops error={err}/>)}
</div>

``` 


## Utilities

TODO: Azoth utils for async

