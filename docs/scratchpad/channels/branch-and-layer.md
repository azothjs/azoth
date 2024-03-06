# Branching and Layering

A single data provider can be split into as many channels as needed to be used in multiple areas of the ui. Each passed transformation function creates a corresponding channel.

As a simple example, consider needing to show total count information in addition to a list of data:

```jsx
const [CatsChannel, CountChannel] = use(fetchCats(),
    // first branch is total count of cats
    cats => cats.length,
    // second branch is channel of Cat[]
    [cat => <Cat {...cat}/>, { map: true }],
);

return <>
    <header>
        <h1>{CountChannel} Cats</h1>
    </header>
    <main>
        <ul>{CatsChannel}</ul>
    </main>
</>;
```

When using a single transform function, the third argument is both
the transform and data provider options. 

However, transform options like `map` and `startWith` are _per_ transformation. Use an array tuple to group the function and options:

```jsx
const [Cats, Count] = use(fetchCats(),
    [cat => <Cat {...cat}/>,  { map: true }], // [!code focus]
    cat => cat.length,
);
```

Tuple syntax is not required when there are no options:

```jsx
const [Cats, Count] = use(fetchCats(),
    [cat => <Cat {...cat}/>,  { map: true }],
    cat => cat.length,  // [!code focus]
);
```
