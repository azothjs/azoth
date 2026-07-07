# Channels

Channels connect asynchronous data to UI layout: 

```jsx
function CatApp() {
    const [CatCount, CatList] = use(fetchCats(), 
        cats => cats.length, 
        [Cat, { map: true, startWith: <Loading/> }], 
    );

    return <>
        <header>
            <h1>😸 {CatCount} Cats</h1>
        </header>

        <main>
            <ul><CatList/></ul>
        </main>
    </>;
}
```

Strong decoupling of time-sliced UIs

## Core Channel API

**Made From:**

1. Required asynchronous data source
1. [Transform mapping functions](transform)
1. Source and transform options

**Return:**

1. A channel for each supplied transform function
1. A dispatch function if the source can be triggered (currently `AsyncGenerator`)
1. Contextual trigger functions for user cancel and request semantics

## Azoth JSX Integration

Replacement semantics

### Flat

### Consistent 

### Alternatives

- Not for intricate synchronous ui work

- RxJS
- Double dispatch issue for "state management"

## Unsubscribing

## Advanced

- Layered and non-UI channels
- Lower level API without async source
    - subscription management
- Anchor dispatch