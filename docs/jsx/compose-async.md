# Async Child Composition `{...}`

A variety of asynchronous data providers can be used with Azoth child composition.

## Thinking Asynchronously

In hypermedia apps, changes to the ui are made in discrete chunks. 

Design templates that:
1. Consume data on initial render
1. Plan for future layout modifications

Let's look at a basic `Promise` for a list as an example.

### Traditional Templates

Consider the following template in a state-driven framework (for simplicity, there are no loading semantics):

```jsx
return <div>{items && <List items={items}/>}</div>;
```

Because time has been abstracted away as a DX feature, there's ambiguity in whether this template is _waiting_ for items:

```jsx
const [items] = useFetchItems();
return <div>{items && <List items={items}/>}</div>;
```

Or whether some responses _don't have items_:

```jsx
const { category, title, items } = useFetchContent();
return <div>{items && <List items={items} />}</div>;
```

Techniques exist to deal with these issues, but fundamentally the difference can only deduced by examining the "effects" used.

### Azoth Hypermedia Templates

Azoth templates delineate between
- what is being rendered right now, _and_
- planning for what will be rendered in the future

Using the example, start by lifting the things that can't be rendered _right now_ out of the returned template:

```jsx
// Returns a promise for a list
const itemsPromise = fetchItems();
// TODO: we need <List items={items}/>, but not now!
return <div>{/*future*/}</div>;
```

That's all that can be rendered initially. Next, plan the layout for the future resolution of items:

```jsx
// Returns a promise for DOM based on the list
const listPromise = fetchItems().then(items => { 
    // This function executes in the future "now" 
    // when the needed data actually exists :) 
    return <List items={items}/>;
});

return <div>{listPromise}</div>; 
```

It's Just JavaScript™️, refactor how you like:

```jsx
<div>
    {fetchItems.then(items => <List items={items}/>)}
</div>
```

## Utilities

TODO: Azoth utils for async

## Async Providers

The following async data structures are supported:

type | mechanism | terminate
---|---|---
`Promise` | `.then()` | abort*
`ReadableStream` | `WritableStream` | close
`AsyncIterator`** | `.next()` | return
observables*** | `.subscribe()` or `.on()` | unsubscribe

*Unless an abort controller is provided, promises can't be cancelled
by consumers 

**i.e. called generator functions

***Duck typing. Return value is expected to be unsubscribe function
